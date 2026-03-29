/**
 * Next.js API Route: POST /api/parse-pdf
 * 路径: project_extract/app/api/parse-pdf/route.ts
 *
 * 功能: 上传 PDF → 提取文字 → 调用 MiniMax LLM 生成 Concept JSON
 * 依赖: npm install pdf-parse
 */

import { NextRequest, NextResponse } from "next/server";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE = "https://api.minimaxi.com/v1";

/** 从 LLM 原始输出中提取 JSON（处理 <think> 标签 + Markdown 代码块） */
function extractJson(raw: string): unknown {
  // 移除 <think> / <thinking> 标签
  const thinkPatterns = [
    /<think>[\s\S]*?<\/think>/gi,
    /<thinking>[\s\S]*?<\/thinking>/gi,
    /<think>[\s\S]*$/gi,
  ];
  let clean = raw;
  for (const p of thinkPatterns) {
    clean = clean.replace(p, "");
  }
  clean = clean.replace(/```json/gi, "").replace(/```/g, "").trim();

  // 直接解析
  try {
    return JSON.parse(clean);
  } catch {}

  // 提取 [] 或 {}
  const m = clean.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }

  console.warn("⚠ Model returned non-JSON output:", raw.slice(0, 300));
  return null;
}

export async function POST(req: NextRequest) {
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: "未配置 MINIMAX_API_KEY" }, { status: 500 });
  }

  try {
    const formData = await req.formData();

    // 支持单文件 "file" 或多文件 "files"
    const fileEntry = formData.get("file") ?? formData.get("files");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "请上传 PDF 文件" }, { status: 400 });
    }
    const file = fileEntry as File;

    // ---- 提取 PDF 文字 ----
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      pdfText = data.text || "";
    } catch (e) {
      console.error("pdf-parse 失败:", e);
      return NextResponse.json({ error: "PDF 解析失败，请确保已安装 pdf-parse" }, { status: 500 });
    }

    if (!pdfText.trim()) {
      return NextResponse.json({ error: "PDF 内容为空或无法提取文字" }, { status: 400 });
    }

    const truncatedText = pdfText.slice(0, 12000);

    // ---- 调用 MiniMax LLM ----
    const prompt = `你是一个知识提炼专家。请从以下 PDF 内容中提取 4-6 个核心知识概念，只返回 JSON 数组，不要有任何其他内容、不要有 Markdown、不要有解释。

PDF 内容：
${truncatedText}

返回格式（JSON 数组）：
[
  {
    "id": "c1",
    "title": "概念标题（简短）",
    "description": "1-2句话描述这个概念是什么",
    "keyPoints": ["关键要点1", "关键要点2", "关键要点3"],
    "connections": ["c2"],
    "slideRange": [1, 5]
  }
]`;

    const llmResp = await fetch(`${MINIMAX_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      }),
    });

    if (!llmResp.ok) {
      const errText = await llmResp.text();
      console.error("MiniMax LLM 失败:", errText);
      return NextResponse.json({ error: "LLM 调用失败" }, { status: 500 });
    }

    const llmData = await llmResp.json();
    console.log("MiniMax full response:", JSON.stringify(llmData).slice(0, 500));

    const rawContent: string =
      llmData?.choices?.[0]?.message?.content ||
      llmData?.choices?.[0]?.content ||
      llmData?.output ||
      llmData?.text ||
      "";

    if (!rawContent) {
      return NextResponse.json({ error: "LLM 返回内容为空" }, { status: 500 });
    }

    const parsed = extractJson(rawContent);
    if (!parsed) {
      // fallback 演示数据
      return NextResponse.json({
        concepts: [
          {
            id: "c1",
            title: "核心概念（演示）",
            description: "LLM 解析失败，这是演示数据",
            keyPoints: ["要点 1", "要点 2"],
            connections: ["c2"],
            slideRange: [1, 5],
          },
        ],
        _demo: true,
      });
    }

    // 规范化返回
    const concepts = (Array.isArray(parsed) ? parsed : (parsed as { concepts?: unknown[] }).concepts || []) as Record<string, unknown>[];
    const normalized = concepts.map((c, i) => ({
      id: (c.id as string) || `c${i + 1}`,
      title: (c.title as string) || "未命名概念",
      description: (c.description as string) || "",
      keyPoints: (c.keyPoints as string[]) || (c.key_points as string[]) || [],
      connections: (c.connections as string[]) || [],
      slideRange: (c.slideRange as number[]) || [1, 1],
    }));

    return NextResponse.json({ concepts: normalized });
  } catch (e) {
    console.error("PDF 处理错误:", e);
    return NextResponse.json({ error: `PDF 处理错误: ${(e as Error).message}` }, { status: 500 });
  }
}

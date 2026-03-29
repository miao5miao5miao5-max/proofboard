/**
 * Next.js API Route: POST /api/transcribe
 * 路径: project_extract/app/api/transcribe/route.ts
 *
 * 功能: 接收音频 Blob → 调用 MiniMax ASR → 返回转写文字
 */

import { NextRequest, NextResponse } from "next/server";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export async function POST(req: NextRequest) {
  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: "未配置 MINIMAX_API_KEY" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audioEntry = formData.get("audio") ?? formData.get("file");

    if (!audioEntry || typeof audioEntry === "string") {
      return NextResponse.json({ error: "缺少音频文件（字段名: audio 或 file）" }, { status: 400 });
    }

    const audioFile = audioEntry as File;
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 MiniMax ASR
    const asrFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type || "audio/webm" });
    asrFormData.append("file", blob, audioFile.name || "audio.webm");

    const asrResp = await fetch("https://api.minimaxi.com/v1/asr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: asrFormData,
    });

    if (!asrResp.ok) {
      const errText = await asrResp.text();
      console.error("MiniMax ASR 失败:", errText);
      return NextResponse.json({ error: "语音转写失败" }, { status: 500 });
    }

    const asrData = await asrResp.json();
    const transcript: string =
      asrData?.text ||
      asrData?.transcript ||
      asrData?.result?.text ||
      "";

    return NextResponse.json({ transcript });
  } catch (e) {
    console.error("transcribe 错误:", e);
    return NextResponse.json({ error: `转写失败: ${(e as Error).message}` }, { status: 500 });
  }
}

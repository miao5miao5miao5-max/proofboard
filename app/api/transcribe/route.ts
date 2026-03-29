import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioEntry = formData.get("audio") ?? formData.get("file");
    const audio = audioEntry instanceof File ? audioEntry : null;

    if (!audio) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MINIMAX_API_KEY not set" }, { status: 500 });
    }

    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    const uploadFormData = new FormData();
    uploadFormData.append(
      "file",
      new Blob([audioBuffer], { type: audio.type || "audio/wav" }),
      audio.name || "audio.wav"
    );
    uploadFormData.append("model", "speech-01");

    const response = await fetch("https://api.minimaxi.com/v1/asr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[transcribe] MiniMax ASR error:", response.status, detail);
      return NextResponse.json(
        {
          transcript: "",
          error: `ASR failed (${response.status})`,
          detail,
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      transcript:
        data.text ??
        data.transcript ??
        data.result?.text ??
        data.data?.text ??
        "",
      error: "",
    });
  } catch (err) {
    console.error("[transcribe] unhandled error:", err instanceof Error ? err.stack : err);
    return NextResponse.json({
      transcript: "",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 200 });
  }
}

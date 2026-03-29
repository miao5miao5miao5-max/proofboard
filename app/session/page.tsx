"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { MainContent } from "@/components/layout/MainContent";
import { ConversationPanel, type ChatMessage } from "@/components/session/ConversationPanel";
import { KeyPointsVisualizer } from "@/components/session/KeyPointsVisualizer";
import { MicButton } from "@/components/session/MicButton";
import { FluidGlassBackground } from "@/components/upload/FluidGlassBackground";
import { GlassStatePanel } from "@/components/ui/GlassStatePanel";

// ── Web Speech API type declarations ────────────────────────────────────────
// These are not in the default TypeScript lib but are available in all
// modern desktop browsers (Chrome, Edge, Safari 14.1+).
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous:          boolean;
  interimResults:      boolean;
  lang:                string;
  onresult:            ((e: SpeechRecognitionEvent) => void) | null;
  onerror:             ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:               (() => void) | null;
  onstart:             (() => void) | null;
  start():             void;
  stop():              void;
  abort():             void;
}
declare const SpeechRecognition: { new(): SpeechRecognition };
declare const webkitSpeechRecognition: { new(): SpeechRecognition };

interface RecorderResult {
  blob: Blob | null;
  transcript: string;
}

interface TranscriptionResult {
  transcript: string;
  error?: string;
}

interface RawConcept {
  id:          string;
  title:       string;
  description: string;
  keyPoints:   string[];
  keyPointsViz?: string;
  connections: string[];
  slideRange?: [number, number];
}

interface EvalResult {
  type:             "follow_up" | "acknowledge" | "complete";
  message:          string;
  score:            number;
  targetPoint?:     string;
  pointsCovered:    string[];
  pointsRemaining:  number;
  round:            number;
}

function readStoredConcepts(): RawConcept[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem("provable_concepts");
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredActiveConceptId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("provable_active_concept");
}

/** Return a SpeechRecognition instance, or null if the browser doesn't support it. */
function createRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  if (!Ctor) return null;
  return new (Ctor as { new(): SpeechRecognition })();
}

function sanitizeDisplayedAiText(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<thinking>[\s\S]*$/gi, "")
    .replace(/<\/think>/gi, "")
    .replace(/<\/thinking>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function persistResultSnapshot(result: EvalResult, concept: RawConcept | null) {
  if (typeof window === "undefined" || !concept) return;

  const covered = result.pointsCovered ?? [];
  const coveredSet = new Set(covered);
  const missing = concept.keyPoints.filter((point) => !coveredSet.has(point));

  localStorage.setItem("provable_result", JSON.stringify({
    score: result.score,
    covered,
    missing,
    question: result.message,
    conceptId: concept.id,
  }));
}

function flushMessageToUi(
  updater: Dispatch<SetStateAction<ChatMessage[]>>,
  aiMessageId: number,
  nextText: string
) {
  updater((messages) =>
    messages.map((message) =>
      message.id === aiMessageId ? { ...message, text: nextText } : message
    )
  );
}

function encodeWav(samples: Float32Array[], sampleRate: number): Blob | null {
  if (samples.length === 0 || sampleRate <= 0) return null;

  const totalLength = samples.reduce((sum, chunk) => sum + chunk.length, 0);
  const pcmData = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of samples) {
    pcmData.set(chunk, offset);
    offset += chunk.length;
  }

  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);

  const writeString = (position: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(position + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, pcmData.length * 2, true);

  let pcmOffset = 44;
  for (let i = 0; i < pcmData.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(pcmOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    pcmOffset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conceptId = searchParams.get("conceptId");

  const [isListening,   setIsListening]   = useState(false);
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [activeConcept, setActiveConcept] = useState<RawConcept | null>(null);
  const [evalResult,    setEvalResult]    = useState<EvalResult | null>(null);
  const [projectName,   setProjectName]   = useState("");
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  // interimText: live partial transcript shown while the user is still speaking
  const [interimText,   setInterimText]   = useState("");
  const [amplitudes,    setAmplitudes]    = useState([0.3, 0.5, 0.8, 0.5, 0.3]);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  // Key points progress tracking
  const [activeKeyPointIndex, setActiveKeyPointIndex] = useState(0);
  const [completedKeyPoints, setCompletedKeyPoints] = useState<number[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);

  const messageIdRef   = useRef(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recordingProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingSamplesRef = useRef<Float32Array[]>([]);
  const recordingSampleRateRef = useRef(0);
  const aiTypewriterTargetRef = useRef("");
  const aiTypewriterDisplayedRef = useRef("");
  const aiTypewriterMessageIdRef = useRef<number | null>(null);
  const aiTypewriterTimerRef = useRef<number | null>(null);
  // Accumulate all final segments across continuous recognition events
  const finalTextRef   = useRef("");
  // Keep last non-empty interim text for smooth UI
  const lastInterimRef = useRef("");

  // Waveform animation refs (Web Audio API — visualisation only, no capture)
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream  | null>(null);
  const animFrameRef = useRef<number       | null>(null);

  // ── Load concept from localStorage on mount ─────────────────────────────
  const syncEvaluationState = useCallback((nextEval: EvalResult, concept: RawConcept | null) => {
    setEvalResult(nextEval);

    if (!concept) return;

    const coveredSet = new Set(nextEval.pointsCovered);
    const nextCompleted = concept.keyPoints
      .map((point, index) => (coveredSet.has(point) ? index : -1))
      .filter((index) => index >= 0);
    const nextActiveIndex = concept.keyPoints.findIndex((point) => !coveredSet.has(point));

    setCompletedKeyPoints(nextCompleted);
    setActiveKeyPointIndex(
      nextActiveIndex === -1 ? Math.max(concept.keyPoints.length - 1, 0) : nextActiveIndex
    );
    persistResultSnapshot(nextEval, concept);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const filename = localStorage.getItem("pb_filename");
    const nextProjectName = filename ? filename.replace(".pdf", "") : "";
    if (nextProjectName) setProjectName(nextProjectName);

    const concepts = readStoredConcepts();
    if (concepts.length === 0) {
      setActiveConcept(null);
      setIsHydrating(false);
      return;
    }

    const requestedConceptId = conceptId ?? readStoredActiveConceptId() ?? concepts[0]?.id ?? null;
    const concept =
      concepts.find((item) => item.id === requestedConceptId) ??
      concepts[0] ??
      null;

    if (!concept) {
      setActiveConcept(null);
      setIsHydrating(false);
      return;
    }

    localStorage.setItem("provable_active_concept", concept.id);
    setActiveConcept(concept);
    setEvalResult(null);
    setActiveKeyPointIndex(0);
    setCompletedKeyPoints([]);
    setMessages([]);
    setIsHydrating(false);

    const firstTopic = concept.keyPoints[0] ?? concept.title;
    const defaultQuestion = `Teacher, could you explain ${firstTopic} to me?`;
    setMessages([{ id: 0, type: "ai", text: defaultQuestion }]);

    fetch("/api/evaluate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        sessionId: nextProjectName || "session",
        conceptId: concept.id,
        transcript: "",
        keyPoints: concept.keyPoints,
        round: 1,
      }),
    })
      .then((res) => res.json())
      .then((data: EvalResult) => {
        syncEvaluationState(data, concept);
        if (data.message && data.message !== defaultQuestion) {
          setMessages([{ id: 0, type: "ai", text: sanitizeDisplayedAiText(data.message) }]);
        }
      })
      .catch(() => {
        // Keep default question on error.
      });
  }, [conceptId, syncEvaluationState]);

  // ── Waveform visualisation helpers ──────────────────────────────────────
  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      recordingSampleRateRef.current = ctx.sampleRate;
      recordingSamplesRef.current = [];

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        recordingSamplesRef.current.push(new Float32Array(channelData));
      };
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
      recordingProcessorRef.current = processor;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const N = 5;
      function tick() {
        analyser.getByteFrequencyData(freqData);
        const step = Math.floor(freqData.length / N);
        setAmplitudes(
          Array.from({ length: N }, (_, i) =>
            freqData[Math.min(i * step, freqData.length - 1)] / 255
          )
        );
        animFrameRef.current = requestAnimationFrame(tick);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Mic permission denied or unavailable — use a synthetic waveform so
      // the UI still animates while speech recognition runs.
      let t = 0;
      function fakeTick() {
        t += 0.12;
        setAmplitudes([
          0.35 + 0.30 * Math.sin(t),
          0.55 + 0.35 * Math.sin(t + 1.2),
          0.70 + 0.25 * Math.sin(t + 2.4),
          0.50 + 0.35 * Math.sin(t + 3.6),
          0.40 + 0.30 * Math.sin(t + 4.8),
        ]);
        animFrameRef.current = requestAnimationFrame(fakeTick);
      }
      animFrameRef.current = requestAnimationFrame(fakeTick);
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    analyserRef.current?.disconnect();
    recordingProcessorRef.current?.disconnect();
    recordingProcessorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current = streamRef.current = audioCtxRef.current = null;
    setAmplitudes([0.3, 0.5, 0.8, 0.5, 0.3]);
  }, []);

  const transcribeRecordedAudio = useCallback(async (): Promise<TranscriptionResult> => {
    const wavBlob = encodeWav(recordingSamplesRef.current, recordingSampleRateRef.current);
    recordingSamplesRef.current = [];
    recordingSampleRateRef.current = 0;

    if (!wavBlob) {
      return { transcript: "", error: "No audio was captured from the microphone." };
    }

    const formData = new FormData();
    formData.append("audio", wavBlob, "session-recording.wav");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    return {
      transcript: typeof data.transcript === "string" ? data.transcript.trim() : "",
      error: typeof data.error === "string" ? data.error : undefined,
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopWaveform();
      if (aiTypewriterTimerRef.current) {
        window.clearInterval(aiTypewriterTimerRef.current);
      }
    };
  }, [stopWaveform]);

  const startTypewriter = useCallback(() => {
    if (aiTypewriterTimerRef.current || aiTypewriterMessageIdRef.current === null) return;

    aiTypewriterTimerRef.current = window.setInterval(() => {
      const messageId = aiTypewriterMessageIdRef.current;
      if (messageId === null) return;

      const target = aiTypewriterTargetRef.current;
      const displayed = aiTypewriterDisplayedRef.current;

      if (displayed === target) {
        if (aiTypewriterTimerRef.current) {
          window.clearInterval(aiTypewriterTimerRef.current);
          aiTypewriterTimerRef.current = null;
        }
        return;
      }

      const step = Math.max(1, Math.ceil((target.length - displayed.length) / 10));
      const nextText = target.slice(0, displayed.length + step);
      aiTypewriterDisplayedRef.current = nextText;
      flushMessageToUi(setMessages, messageId, nextText);
    }, 18);
  }, []);

  const resetTypewriter = useCallback((aiMessageId: number) => {
    if (aiTypewriterTimerRef.current) {
      window.clearInterval(aiTypewriterTimerRef.current);
      aiTypewriterTimerRef.current = null;
    }
    aiTypewriterMessageIdRef.current = aiMessageId;
    aiTypewriterTargetRef.current = "";
    aiTypewriterDisplayedRef.current = "";
  }, []);

  // ── Call /api/evaluate with the final transcript ─────────────────────────
  const runEvaluation = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    setInterimText("");

    // Show what the user said as a chat bubble
    setMessages((m) => [
      ...m,
      { id: ++messageIdRef.current, type: "user", text: transcript },
    ]);

    try {
      const res = await fetch("/api/evaluate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sessionId: projectName || "session",
          conceptId: activeConcept?.id       ?? "",
          transcript,
          inputMode: "voice",
          keyPoints: activeConcept?.keyPoints ?? [],
          round:    activeKeyPointIndex + 1,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json() as EvalResult;
        const cleanedMessage = sanitizeDisplayedAiText(data.message);
        syncEvaluationState({ ...data, message: cleanedMessage }, activeConcept);
        setMessages((m) => [
          ...m,
          { id: ++messageIdRef.current, type: "ai", text: cleanedMessage },
        ]);
        return;
      }

      // Create a placeholder message that will be updated as stream comes in
      const aiMessageId = ++messageIdRef.current;
      resetTypewriter(aiMessageId);
      setMessages((m) => [
        ...m,
        { id: aiMessageId, type: "ai", text: "" },
      ]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";
      let streamedEval: EvalResult | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullMessage += parsed.content;
                  aiTypewriterTargetRef.current = sanitizeDisplayedAiText(fullMessage);
                  startTypewriter();
                }
                if (parsed.replace && typeof parsed.message === "string") {
                  fullMessage = sanitizeDisplayedAiText(parsed.message);
                  aiTypewriterTargetRef.current = fullMessage;
                  aiTypewriterDisplayedRef.current = fullMessage;
                  flushMessageToUi(setMessages, aiMessageId, fullMessage);
                }
                if (parsed.done) {
                  streamedEval = {
                    type: parsed.type ?? "follow_up",
                    message: typeof parsed.message === "string"
                      ? sanitizeDisplayedAiText(parsed.message)
                      : sanitizeDisplayedAiText(fullMessage),
                    score: typeof parsed.score === "number" ? parsed.score : 0,
                    targetPoint: typeof parsed.targetPoint === "string" ? parsed.targetPoint : undefined,
                    pointsCovered: Array.isArray(parsed.pointsCovered) ? parsed.pointsCovered : [],
                    pointsRemaining: typeof parsed.pointsRemaining === "number" ? parsed.pointsRemaining : 0,
                    round: typeof parsed.round === "number" ? parsed.round : activeKeyPointIndex + 1,
                  };

                  if (typeof parsed.message === "string") {
                    fullMessage = sanitizeDisplayedAiText(parsed.message);
                    aiTypewriterTargetRef.current = fullMessage;
                    aiTypewriterDisplayedRef.current = fullMessage;
                    flushMessageToUi(setMessages, aiMessageId, fullMessage);
                  }

                  if (streamedEval) {
                    syncEvaluationState(streamedEval, activeConcept);
                  }
                  // Stream complete
                  setIsProcessing(false);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      console.error("[Evaluate] error:", err);
      setMessages((m) => [
        ...m,
        {
          id:   ++messageIdRef.current,
          type: "ai",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [activeConcept, activeKeyPointIndex, projectName, resetTypewriter, startTypewriter, syncEvaluationState]);

  // ── Mic toggle ───────────────────────────────────────────────────────────
  const handleToggleMic = useCallback(async () => {
    if (isProcessing) return;

    if (!isListening) {
      // ── START ────────────────────────────────────────────────────────────
      const recognition = createRecognition();

      // ===== VOICE API INTEGRATION POINT =====
      // Current: Web Speech API (browser native)
      // Target:  MiniMax ASR WebSocket stream
      // Swap point: replace startRecognition() internals below with a
      //   WebSocket connection to wss://api.minimaxi.com/v1/asr/stream
      //   Auth: Bearer token from env MINIMAX_API_KEY
      //   Send raw PCM audio chunks from getUserMedia, receive JSON transcripts
      // =========================================

      finalTextRef.current = "";
      if (recognition) {
        recognition.continuous     = true;   // keep listening until we call stop()
        recognition.interimResults = true;   // stream partial results for live feedback
        recognition.lang           = "en-US";

        recognition.onstart = () => {
          console.log("[Speech] recognition started");
        };

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let interim = "";
          let finalSegment = "";

          for (let i = e.resultIndex; i < e.results.length; i++) {
            const text = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalSegment += text;
            } else {
              interim += text;
            }
          }

          if (finalSegment) {
            finalTextRef.current += (finalTextRef.current ? " " : "") + finalSegment.trim();
          }
          if (interim) {
            lastInterimRef.current = interim;
            setIsSpeaking(true);
          }
          setInterimText(interim);
        };

        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
          if (e.error === "no-speech") return;
          console.error("[Speech] error:", e.error);
        };

        recognition.onend = () => {
          console.log("[Speech] recognition ended, finalText:", finalTextRef.current);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        recognitionRef.current = null;
      }

      // Start the waveform visualiser in parallel (doesn't block recognition)
      await startWaveform();
      setIsListening(true);
    } else {
      // ── STOP ─────────────────────────────────────────────────────────────
      setIsListening(false);
      stopWaveform();

      const recognition = recognitionRef.current;
      recognitionRef.current = null;

      // Snapshot the accumulated final text before stop() clears state
      const browserTranscript = finalTextRef.current.trim();
      const browserInterimTranscript = lastInterimRef.current.trim();
      finalTextRef.current = "";
      lastInterimRef.current = "";
      setInterimText("");
      setIsSpeaking(false);

      // Stop the recogniser — this will fire onend but we've already
      // captured the transcript above so onend is a no-op.
      recognition?.stop();
      setIsProcessing(true);

      let transcript = "";
      let transcriptionError = "";
      try {
        const result = await transcribeRecordedAudio();
        transcript = result.transcript;
        transcriptionError = result.error ?? "";
      } catch (error) {
        console.error("[Transcribe] upload fallback failed:", error);
        transcriptionError = error instanceof Error ? error.message : "Unknown transcription error";
      }

      if (!transcript) {
        transcript = browserTranscript;
      }

      if (!transcript) {
        transcript = browserInterimTranscript;
      }

      if (!transcript) {
        setIsProcessing(false);
        setMessages((m) => [
          ...m,
          {
            id:   ++messageIdRef.current,
            type: "ai",
            text: transcriptionError
              ? `I couldn't transcribe your voice just now (${transcriptionError}). Please try speaking again.`
              : "I didn't catch anything. Please try speaking again.",
          },
        ]);
        return;
      }

      await runEvaluation(transcript);
    }
  }, [isListening, isProcessing, startWaveform, stopWaveform, runEvaluation, transcribeRecordedAudio]);

  // ── End session ──────────────────────────────────────────────────────────
  const handleEndSession = useCallback(() => {
    recognitionRef.current?.abort();
    stopWaveform();

    const covered = evalResult?.pointsCovered ?? [];
    const result = {
      score: evalResult?.score ?? 0,
      covered,
      missing: activeConcept?.keyPoints.filter((point) => !covered.includes(point)) ?? [],
      question: evalResult?.message ?? "You ended the session before a scored readout, so this attempt starts at 0%.",
    };

    localStorage.setItem("provable_result", JSON.stringify({
      score:     result.score,
      covered:   result.covered,
      missing:   result.missing,
      question:  result.question,
      conceptId: activeConcept?.id ?? "",
    }));
    router.push("/result");
  }, [evalResult, activeConcept, router, stopWaveform]);

  const keyPoints = activeConcept?.keyPoints ?? [];

  if (isHydrating) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-transparent">
        <FluidGlassBackground />
        <SideNav user={{ name: "Max", role: "Student" }} />
        <TopBar projectName={projectName || "Session"} />

        <MainContent className="overflow-x-hidden px-6 pb-6 pt-8 sm:px-8 sm:pt-10">
          <div className="flex h-full items-center justify-center px-6">
            <GlassStatePanel
              icon="hourglass_top"
              title="Loading session"
              description="We're restoring your current concept and latest study context."
              actionLabel="Back to Canvas"
              onAction={() => router.push("/canvas")}
            />
          </div>
        </MainContent>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent">
      <FluidGlassBackground />
      <SideNav user={{ name: "Max", role: "Student" }} />
      <TopBar projectName={projectName || "Session"} />

      <MainContent className="overflow-x-hidden px-6 pb-6 pt-8 sm:px-8 sm:pt-10">
        {!activeConcept ? (
          <div className="flex h-full items-center justify-center px-6">
            <GlassStatePanel
              icon="school"
              title="No concept selected"
              description="Pick a concept from the canvas first, then come back here to start the teach-back session."
              actionLabel="Go to Canvas"
              onAction={() => router.push("/canvas")}
            />
          </div>
        ) : (
          <div className="flex min-h-0 h-[calc(100vh-8rem)] gap-5 pt-2 sm:h-[calc(100vh-8.5rem)]">
        {/* ── Left panel: concept key points ────────────────────────────── */}
        <section className="glass-panel-base flex min-w-0 min-h-0 flex-[0.9] flex-col overflow-hidden rounded-[30px] p-5 sm:p-6">
          <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3 sm:mb-5 sm:gap-4">
            <h2 className="min-w-0 flex-1 break-words whitespace-normal text-headline-lg text-on-surface">
              {activeConcept.title}
            </h2>
            <span className="glass-pill-elevated shrink-0 rounded-full px-3 py-1 text-label-md uppercase text-outline">
              Key Points
            </span>
          </div>

          <div className="glass-panel-subtle relative flex-1 min-h-0 overflow-hidden rounded-[24px] p-4 sm:p-6">
            <KeyPointsVisualizer
              keyPoints={keyPoints}
              activeIndex={activeKeyPointIndex}
              completedIndices={completedKeyPoints}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            {[
              { color: "bg-secondary",       label: "Covered" },
              { color: "bg-blue-400",        label: "Active"  },
              { color: "bg-outline-variant", label: "Pending" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-body-md text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right panel: conversation + mic ───────────────────────────── */}
        <section className="flex min-w-0 flex-[1.15] flex-col gap-4 min-h-0">
          {/*
            Pass interimText down as a synthetic in-progress message so the
            ConversationPanel can show it in the waveform area without us
            having to modify that component. We inject it as an extra prop-
            level value handled entirely here in the parent.
          */}
          <ConversationPanel
            messages={
              isListening
                ? [
                    ...messages,
                    // Ephemeral interim bubble — same id trick used elsewhere;
                    // -1 is never stored so it won't collide with real messages.
                    { id: -1, type: "user" as const, text: (interimText || lastInterimRef.current) + "…" },
                  ]
                : messages
            }
            isListening={isListening}
            amplitudes={amplitudes}
          />

          <div className="glass-panel-base shrink-0 rounded-[28px] px-6 py-6">
            <div className="flex flex-col items-center justify-center gap-5 text-center">
              <div className="max-w-[18rem] space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant/80">
                  Voice Control
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {isProcessing
                    ? "Evaluating your answer…"
                    : isListening
                    ? "Listening now. Keep explaining naturally."
                    : "Tap the mic and start your teach-back."}
                </p>
              </div>
              <MicButton
                isListening={isListening}
                onToggle={handleToggleMic}
              />

              <button
                type="button"
                onClick={handleEndSession}
                className="glass-pill-elevated inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant transition-all duration-200 hover:-translate-y-0.5 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>End Session</span>
              </button>
            </div>
          </div>
        </section>
          </div>
        )}
      </MainContent>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionPageContent />
    </Suspense>
  );
}

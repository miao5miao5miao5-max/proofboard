"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: number;
  type: "ai" | "user";
  text: string;
}

export interface ConversationPanelProps {
  messages: ChatMessage[];
  isListening: boolean;
  amplitudes: number[];
}

export function ConversationPanel({
  messages,
  isListening,
  amplitudes,
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestText = messages[messages.length - 1]?.text ?? "";

  // Auto-scroll to newest message / waveform
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, latestText, isListening]);

  return (
    <div className="glass-panel-base flex-1 min-h-0 min-w-0 overflow-hidden rounded-[30px]">
      {/* Header */}
      <div className="flex min-w-0 shrink-0 items-center gap-3 border-b border-slate-200/55 bg-white/42 px-5 py-4 sm:px-6">
        <div className="glass-pill-elevated flex h-10 w-10 items-center justify-center rounded-2xl text-primary">
          <span className="material-symbols-outlined text-xl">
            psychology
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words whitespace-normal text-headline-sm text-on-surface">Conversation</h3>
          <p className="break-words whitespace-normal text-xs uppercase tracking-[0.18em] text-on-surface-variant/80">
            Live teach-back
          </p>
        </div>
        <div className="glass-pill-elevated ml-auto max-w-full shrink rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
          {isListening ? "Recording" : "Ready"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex min-w-0 gap-2 bubble-enter ${
              msg.type === "ai" ? "justify-start" : "justify-end"
            }`}
          >
            {/* AI avatar */}
            {msg.type === "ai" && (
              <div className="glass-pill-elevated mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: 14 }}
                >
                  smart_toy
                </span>
              </div>
            )}

            {/* Bubble */}
            <div
              className={cn(
                "min-w-0 max-w-[86%] break-words whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[22px] px-4 py-3 text-body-md leading-relaxed",
                msg.type === "ai"
                  ? "glass-bubble-elevated rounded-tl-sm text-on-surface"
                  : "rounded-tr-sm border border-sky-200/90 bg-[linear-gradient(135deg,rgba(54,112,232,0.98),rgba(67,160,246,0.94))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] [filter:drop-shadow(0_10px_24px_rgba(31,38,135,0.06))_drop-shadow(0_2px_8px_rgba(31,38,135,0.03))]"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Live waveform while listening (appears as a "user is typing" indicator) */}
        {isListening && (
          <div className="flex min-w-0 justify-end gap-2 bubble-enter">
            <div className="glass-bubble-elevated flex min-w-0 max-w-[86%] items-center gap-[3px] rounded-[22px] rounded-tr-sm bg-[linear-gradient(135deg,rgba(231,240,255,0.96),rgba(214,231,255,0.9))] px-5 py-3">
              {amplitudes.map((amp, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-[#4f8ef7]"
                  style={{
                    height: `${Math.max(4, amp * 28)}px`,
                    transition: "height 100ms ease-out",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

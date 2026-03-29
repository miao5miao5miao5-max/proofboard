"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { MainContent } from "@/components/layout/MainContent";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { FluidGlassBackground } from "@/components/upload/FluidGlassBackground";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ExtractionLoader } from "@/components/ExtractionLoader";
import { useTypewriter } from "@/hooks/useTypewriter";

const TITLE_TEXT    = "Upload Your Slides";
const SUBTITLE_TEXT = "Drop your lecture slides to generate an interactive concept map for mastery learning";

export default function UploadPage() {
  const router = useRouter();

  const [files, setFiles]   = useState<File[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Typewriter ──────────────────────────────────────────────────────────
  const { displayed: titleDisplayed, showCursor: titleCursor, isDone: titleDone } =
    useTypewriter(TITLE_TEXT, 60, 0);

  // ── File handling ───────────────────────────────────────────────────────
  const handleFilesChange = useCallback((incoming: File[]) => {
    setFiles(incoming);
    setApiError(null);
  }, []);

  // ── Generate Canvas (real API call) ────────────────────────────────────
  const handleGenerateCanvas = useCallback(async () => {
    if (files.length === 0 || isLoading) return;

    setLoading(true);
    setApiError(null);

    try {
      localStorage.removeItem("provable_concepts");
      localStorage.removeItem("provable_active_concept");
      localStorage.removeItem("provable_result");
      localStorage.removeItem("pb_filename");

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
      }

      const data = await res.json();
      const concepts = Array.isArray(data.concepts) ? data.concepts : [];

      if (concepts.length === 0) {
        throw new Error("No concepts extracted from PDF");
      }

      localStorage.setItem("provable_concepts", JSON.stringify(concepts));
      localStorage.setItem("pb_filename", files[0].name);

      router.push("/canvas");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [files, isLoading, router]);

  const hasFiles = files.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <FluidGlassBackground />
      <SideNav user={{ name: "Max", role: "Student" }} />
      <TopBar />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80">
          <ExtractionLoader />
        </div>
      )}

      <MainContent className="px-8">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-10 py-10">
            <div className="glass-panel-base w-full max-w-3xl rounded-[32px] px-10 py-8 text-center">
              <div className="mx-auto space-y-4">
                <h1
                  className="text-display-lg gradient-text cursor-default select-none"
                  style={{ minHeight: "1.1em" }}
                >
                  {titleDisplayed}
                  {titleCursor && !titleDone && (
                    <span className="cursor-blink inline-block w-[3px] h-[0.85em] bg-primary ml-1 align-middle" aria-hidden="true" />
                  )}
                </h1>

                <p className="mx-auto max-w-md text-body-md text-on-surface-variant">
                  {SUBTITLE_TEXT}
                </p>
              </div>
            </div>

            <UploadDropzone onFilesChange={handleFilesChange} />

            {apiError && (
              <p className="max-w-md text-center text-sm font-medium text-red-500">
                ⚠ {apiError}
              </p>
            )}

            <PrimaryButton
              label={isLoading ? "Analyzing PDF…" : "Generate Canvas"}
              icon={isLoading ? "hourglass_top" : "arrow_forward"}
              onClick={handleGenerateCanvas}
              disabled={!hasFiles || isLoading}
              size="lg"
            />
          </div>
        </div>
      </MainContent>
    </div>
  );
}

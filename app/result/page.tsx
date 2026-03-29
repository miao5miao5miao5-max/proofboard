"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { MainContent } from "@/components/layout/MainContent";
import { ProofCard } from "@/components/result/ProofCard";
import { PaginationBar } from "@/components/result/PaginationBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { FluidGlassBackground } from "@/components/upload/FluidGlassBackground";
import { GlassStatePanel } from "@/components/ui/GlassStatePanel";

interface StoredResult {
  score: number;
  covered: string[];
  missing: string[];
  question: string | null;
  conceptId: string;
}

interface ProofCardData {
  score: number;
  covered: string[];
  missed: string[];
  aiInsight: string;
  conceptName: string;
}

interface RawConcept {
  id: string;
  title: string;
  keyPoints?: string[];
}

function readStoredActiveConceptId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("provable_active_concept");
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

function readStoredResult(): StoredResult | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("provable_result");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<StoredResult>;
    if (
      typeof parsed.score !== "number" ||
      !Array.isArray(parsed.covered) ||
      !Array.isArray(parsed.missing) ||
      typeof parsed.conceptId !== "string"
    ) {
      return null;
    }

    return {
      score: parsed.score,
      covered: parsed.covered,
      missing: parsed.missing,
      question: typeof parsed.question === "string" ? parsed.question : null,
      conceptId: parsed.conceptId,
    };
  } catch {
    return null;
  }
}

function writeStoredResult(result: StoredResult) {
  if (typeof window === "undefined") return;
  localStorage.setItem("provable_result", JSON.stringify(result));
}

function buildDefaultStoredResult(concept: RawConcept): StoredResult {
  return {
    score: 0,
    covered: [],
    missing: concept.keyPoints ?? [],
    question: "You ended the session before a scored readout, so this attempt starts at 0%.",
    conceptId: concept.id,
  };
}

function toProofCardData(stored: StoredResult, concepts: RawConcept[]): ProofCardData | null {
  const concept =
    concepts.find((candidate) => candidate.id === stored.conceptId) ??
    concepts[0] ??
    null;
  if (!concept) return null;

  return {
    score: stored.score,
    covered: stored.covered,
    missed: stored.missing,
    aiInsight:
      stored.question ??
      "Great effort. Review the missing points, then try another teach-back round.",
    conceptName: concept.title,
  };
}

function getResultCopy(score: number) {
  if (score >= 85) {
    return {
      title: "You can explain this clearly.",
      description: "Your teach-back covered the core ideas. This is a good moment to move forward while the structure is fresh.",
    };
  }

  if (score >= 60) {
    return {
      title: "You're close to a solid explanation.",
      description: "The foundation is there. One more pass on the missed points should tighten the story and lift your recall.",
    };
  }

  if (score > 0) {
    return {
      title: "You have the outline, not the full proof yet.",
      description: "Use the missed section as a checklist. A focused retry on this concept will help more than jumping ahead immediately.",
    };
  }

  return {
    title: "No strong readout yet.",
    description: "This attempt ended before the system could confirm coverage. You can retry the same concept or return to the map.",
  };
}

export default function ResultPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Moving to your next concept...");
  const [cardData, setCardData] = useState<ProofCardData | null>(null);
  const [resultConceptId, setResultConceptId] = useState<string | null>(null);
  const [hasConcepts, setHasConcepts] = useState(false);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [totalConcepts, setTotalConcepts] = useState(0);
  const [nextConcept, setNextConcept] = useState<RawConcept | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const concepts = readStoredConcepts();
    setHasConcepts(concepts.length > 0);
    setTotalConcepts(concepts.length);

    if (concepts.length === 0) {
      setCardData(null);
      setResultConceptId(null);
      setNextConcept(null);
      setIsHydrated(true);
      return;
    }

    const activeConceptId = readStoredActiveConceptId();
    const fallbackConcept =
      concepts.find((concept) => concept.id === activeConceptId) ??
      concepts[0] ??
      null;

    let result = readStoredResult();
    if (!result && fallbackConcept) {
      result = buildDefaultStoredResult(fallbackConcept);
      writeStoredResult(result);
    }

    if (!result) {
      setCardData(null);
      setResultConceptId(null);
      setNextConcept(null);
      setIsHydrated(true);
      return;
    }

    let resolvedResult = result;

    if (!concepts.some((concept) => concept.id === resolvedResult.conceptId) && fallbackConcept) {
      resolvedResult = {
        ...resolvedResult,
        conceptId: fallbackConcept.id,
        missing: resolvedResult.missing.length > 0
          ? resolvedResult.missing
          : (fallbackConcept.keyPoints ?? []),
      };
      writeStoredResult(resolvedResult);
    }

    const nextCardData = toProofCardData(resolvedResult, concepts);
    const resolvedIndex = concepts.findIndex((concept) => concept.id === resolvedResult.conceptId);
    const safeIndex = resolvedIndex >= 0 ? resolvedIndex : 0;

    setConceptIndex(safeIndex);
    setNextConcept(concepts[safeIndex + 1] ?? null);
    setCardData(nextCardData);
    setResultConceptId(resolvedResult.conceptId);
    setIsHydrated(true);
  }, []);

  const handleTryAgain = useCallback(() => {
    if (!resultConceptId) {
      router.push("/session");
      return;
    }

    localStorage.setItem("provable_active_concept", resultConceptId);
    router.push(`/session?conceptId=${resultConceptId}`);
  }, [resultConceptId, router]);

  const handlePrimaryAction = useCallback(() => {
    const destination = nextConcept ? `/session?conceptId=${nextConcept.id}` : "/canvas";
    const nextMessage = nextConcept
      ? `Moving to ${nextConcept.title}...`
      : "Returning to your concept map...";

    if (nextConcept) {
      localStorage.setItem("provable_active_concept", nextConcept.id);
    }

    if ((cardData?.score ?? 0) >= 85) {
      setShowConfetti(true);
    }

    setToastMessage(nextMessage);
    setShowToast(true);
    window.setTimeout(() => router.push(destination), 700);
  }, [cardData?.score, nextConcept, router]);

  const handleOpenSession = useCallback(() => {
    const activeConceptId = resultConceptId ?? readStoredActiveConceptId();
    if (activeConceptId) {
      router.push(`/session?conceptId=${activeConceptId}`);
      return;
    }

    router.push("/session");
  }, [resultConceptId, router]);

  const summaryCopy = getResultCopy(cardData?.score ?? 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <FluidGlassBackground />
      {showConfetti && <ConfettiEffect onDone={() => setShowConfetti(false)} />}
      {showToast && (
        <ToastNotification
          message={toastMessage}
          duration={1800}
          onDone={() => setShowToast(false)}
        />
      )}

      <SideNav user={{ name: "Max", role: "Student" }} />
      <TopBar />

      <MainContent className="overflow-y-auto px-6 pb-20 pt-8 sm:px-8 sm:pt-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {!isHydrated ? (
            <div className="flex min-h-[60vh] items-center justify-center px-6">
              <GlassStatePanel
                icon="hourglass_top"
                title="Loading your readout"
                description="We're restoring your latest session so the proof card can pick up exactly where the learning flow left off."
                actionLabel="Back to Canvas"
                onAction={() => router.push("/canvas")}
              />
            </div>
          ) : !hasConcepts ? (
            <div className="flex min-h-[60vh] items-center justify-center px-6">
              <GlassStatePanel
                icon="upload_file"
                title="No course yet"
                description="Upload slides first, then your result dashboard will appear here once you finish a teach-back session."
                actionLabel="Upload Slides"
                onAction={() => router.push("/upload")}
              />
            </div>
          ) : !cardData || !resultConceptId ? (
            <div className="flex min-h-[60vh] items-center justify-center px-6">
              <GlassStatePanel
                icon="analytics"
                title="No readout yet"
                description="Your result view is ready, but there isn't a stored session outcome yet. Jump back into the active concept to generate one."
                actionLabel="Go to Session"
                onAction={handleOpenSession}
              />
            </div>
          ) : (
            <>
              <section className="glass-panel-base rounded-[32px] px-6 py-7 sm:px-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <PaginationBar current={conceptIndex + 1} total={Math.max(totalConcepts, 1)} />
                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-outline">
                      Result
                    </p>
                    <h1 className="mt-3 text-display-lg gradient-text">
                      {summaryCopy.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-body-md leading-7 text-on-surface-variant">
                      {summaryCopy.description}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="glass-pill-elevated rounded-[24px] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                        Score
                      </p>
                      <p className="mt-2 text-3xl font-black text-on-surface">
                        {cardData.score}%
                      </p>
                    </div>
                    <div className="glass-pill-elevated rounded-[24px] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                        Covered
                      </p>
                      <p className="mt-2 text-3xl font-black text-on-surface">
                        {cardData.covered.length}
                      </p>
                    </div>
                    <div className="glass-pill-elevated rounded-[24px] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                        Next Step
                      </p>
                      <p className="mt-2 text-lg font-bold text-on-surface">
                        {nextConcept ? nextConcept.title : "Back to canvas"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="w-full">
                <ProofCard
                  score={cardData.score}
                  covered={cardData.covered}
                  missed={cardData.missed}
                  aiInsight={cardData.aiInsight}
                  conceptName={cardData.conceptName}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SecondaryButton
                  label="Try Again"
                  icon="refresh"
                  iconPosition="left"
                  onClick={handleTryAgain}
                  size="md"
                />
                <PrimaryButton
                  label={nextConcept ? "Start Next Concept" : "Back to Canvas"}
                  icon="arrow_forward"
                  iconPosition="right"
                  onClick={handlePrimaryAction}
                  size="lg"
                />
              </div>
            </>
          )}
        </div>
      </MainContent>
    </div>
  );
}

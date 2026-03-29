"use client";

import { useState } from "react";
import { ExpandableTopicItem } from "@/components/result/ExpandableTopicItem";

export interface ProofCardProps {
  score: number;
  covered: string[];
  missed: string[];
  aiInsight: string;
  conceptName: string;
}

function getExplanation(topic: string): string {
  return `${topic} is an important point to revisit. Reworking it from the source material and practicing another teach-back will make your explanation sharper and easier to recall.`;
}

export function ProofCard({
  score,
  covered,
  missed,
  aiInsight,
  conceptName,
}: ProofCardProps) {
  // Accordion: track which item (if any) is expanded — keyed as "covered-N" | "missed-N"
  const [openKey, setOpenKey] = useState<string | null>(null);

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="glass-panel-base rounded-[32px] p-6 sm:p-8">
      {/* Header with Score */}
      <div className="mb-8 flex flex-col gap-5 border-b border-white/45 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-label-md uppercase text-outline">Proof Card</p>
          <h2 className="text-headline-lg text-on-surface">{conceptName}</h2>
        </div>
        <div className="sm:text-right">
          <p className="mb-1 text-label-md uppercase text-outline">Mastery Score</p>
          <span className="text-display-lg bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
            {score}%
          </span>
        </div>
      </div>

      {/* Covered / Missed Grid */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* Covered */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">check_circle</span>
            <h3 className="text-headline-sm text-on-surface">Covered</h3>
          </div>
          {covered.length === 0 ? (
            <div className="glass-panel-subtle rounded-[24px] px-5 py-6 text-body-md text-on-surface-variant">
              No confirmed key points yet. A tighter retry should start filling this column quickly.
            </div>
          ) : (
            <div className="space-y-2">
              {covered.map((item, index) => {
                const key = `covered-${index}`;
                return (
                  <ExpandableTopicItem
                    key={key}
                    label={item}
                    explanation={getExplanation(item)}
                    type="covered"
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Missed */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">cancel</span>
            <h3 className="text-headline-sm text-on-surface">Missed</h3>
          </div>
          {missed.length === 0 ? (
            <div className="glass-success-surface rounded-[24px] px-5 py-6 text-body-md text-on-surface">
              Nothing was left uncovered in this concept. This is the exact shape a finished proof card should have.
            </div>
          ) : (
            <div className="space-y-2">
              {missed.map((item, index) => {
                const key = `missed-${index}`;
                return (
                  <ExpandableTopicItem
                    key={key}
                    label={item}
                    explanation={getExplanation(item)}
                    type="missed"
                    isOpen={openKey === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div className="glass-focus-surface rounded-[28px] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
          <div>
            <h4 className="mb-2 text-headline-sm text-on-surface">AI Insight</h4>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export interface ExpandableTopicItemProps {
  label: string;
  explanation: string;
  type: "covered" | "missed";
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ExpandableTopicItem({
  label,
  explanation,
  type,
  isOpen = false,
  onToggle,
}: ExpandableTopicItemProps) {
  // If onToggle is provided, this is controlled (accordion); otherwise self-managed
  const [localOpen, setLocalOpen] = useState(false);
  const expanded = onToggle !== undefined ? isOpen : localOpen;

  function handleClick() {
    if (onToggle) {
      onToggle();
    } else {
      setLocalOpen((v) => !v);
    }
  }

  const isCovered = type === "covered";

  return (
    <div
      className={`rounded-lg overflow-hidden transition-shadow ${
        isCovered
          ? "bg-secondary-container/20"
          : "bg-tertiary-container/10"
      } ${expanded ? "shadow-ghost" : ""}`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={handleClick}
        aria-expanded={expanded}
      >
        <span
          className={`material-symbols-outlined text-lg shrink-0 ${
            isCovered ? "text-secondary" : "text-tertiary"
          }`}
        >
          {isCovered ? "check" : "close"}
        </span>

        <span className="text-body-md text-on-surface flex-1">{label}</span>

        <span
          className="material-symbols-outlined text-outline shrink-0 transition-transform duration-300"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", fontSize: 18 }}
        >
          expand_more
        </span>
      </button>

      {/* Expandable body — max-height transition */}
      <div
        style={{
          maxHeight: expanded ? "200px" : "0px",
          overflow: "hidden",
          transition: "max-height 300ms ease-out",
        }}
      >
        <div className="px-4 pb-4 space-y-2">
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {explanation}
          </p>
          <a
            href="#"
            className={`text-sm font-semibold inline-flex items-center gap-1 ${
              isCovered ? "text-secondary" : "text-primary"
            }`}
            onClick={(e) => e.preventDefault()}
          >
            Learn more
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              arrow_forward
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRipple } from "@/hooks/useRipple";

export interface ButtonProps {
  label: string;
  icon?: string;
  iconPosition?: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-5 py-2 text-sm",
  md: "px-8 py-3 text-sm",
  lg: "px-10 py-4 text-base",
};

export function SecondaryButton({
  label,
  icon,
  iconPosition = "right",
  onClick,
  disabled = false,
  size = "md",
}: ButtonProps) {
  const ripple = useRipple();

  return (
    <button
      onClick={(e) => { ripple(e); onClick(); }}
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center gap-2
        bg-transparent text-primary rounded-xl font-bold
        border border-outline-variant/20
        hover:bg-surface-container-low btn-scale
        relative overflow-hidden
        ${sizeClasses[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {icon && iconPosition === "left" && (
        <span className="material-symbols-outlined text-[1em] transition-transform group-hover:-translate-x-1">
          {icon}
        </span>
      )}
      <span>{label}</span>
      {icon && iconPosition === "right" && (
        <span className="material-symbols-outlined text-[1em] transition-transform group-hover:translate-x-1">
          {icon}
        </span>
      )}
    </button>
  );
}

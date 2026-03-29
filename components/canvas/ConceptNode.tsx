"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";

export type NodeStatus = "done" | "active" | "locked" | "pending" | "unvisited";

export interface ConceptNodeProps {
  data: {
    id: string;
    label: string;
    description: string;
    status: NodeStatus;
    icon: string;
    index?: number;
  };
}

const statusBorderClass: Record<NodeStatus, string> = {
  done: "border-secondary",
  active: "border-primary",
  locked: "border-outline-variant opacity-60 hover:opacity-100",
  pending: "border-outline-variant opacity-60 hover:opacity-100",
  unvisited: "border-outline-variant opacity-60 hover:opacity-100",
};

const badgeStyles: Record<NodeStatus, string> = {
  done: "bg-secondary-container text-on-secondary-container",
  active: "bg-primary-container text-on-primary-container",
  locked: "bg-surface-container-low text-outline",
  pending: "bg-surface-container-low text-outline",
  unvisited: "bg-surface-container-low text-outline",
};

const statusLabels: Record<NodeStatus, string> = {
  done: "DONE",
  active: "ACTIVE",
  locked: "LOCKED",
  pending: "PENDING",
  unvisited: "UNVISITED",
};

function getNodeShadow(status: NodeStatus, isHovered: boolean): string {
  if (status === "done") {
    return isHovered
      ? "0 0 20px rgba(52,211,153,0.65)"
      : "0 0 12px rgba(52,211,153,0.4)";
  }
  if (status === "active") {
    return isHovered
      ? "0 0 20px rgba(79,142,247,0.65)"
      : "0 0 12px rgba(79,142,247,0.4)";
  }
  return isHovered ? "0 0 10px rgba(100,100,120,0.18)" : "none";
}

export function ConceptNode({ data }: ConceptNodeProps) {
  const { label, description, status, icon, index = 0 } = data;
  const router = useRouter();
  const [showPopover, setShowPopover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showPopover) return;
    function handleClickOutside(e: MouseEvent) {
      if (nodeRef.current && !nodeRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  const borderWidth = isHovered ? "3px" : "2px";

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
      className={`
        relative w-60 p-5 bg-white rounded-2xl
        transition-colors duration-200 cursor-pointer
        border ${statusBorderClass[status]}
      `}
      style={{
        borderWidth,
        boxShadow: getNodeShadow(status, isHovered),
      }}
      onClick={() => setShowPopover((v) => !v)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-outline-variant border-2 border-surface-container-lowest"
      />

      {/* Icon */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center mb-3
          ${status === "done" ? "bg-secondary-container" : status === "active" ? "bg-primary-fixed" : "bg-surface-container-low"}
        `}
      >
        <span
          className={`
            material-symbols-outlined text-xl
            ${status === "done" ? "text-secondary" : status === "active" ? "text-primary" : "text-outline"}
          `}
        >
          {icon}
        </span>
      </div>

      {/* Label */}
      <h3 className="text-headline-sm text-on-surface mb-1">{label}</h3>

      {/* Description */}
      <p className="text-body-md text-on-surface-variant mb-3">
        {description}
      </p>

      {/* Status Badge */}
      <span
        className={`
          inline-block text-label-md uppercase px-3 py-1 rounded-full
          ${badgeStyles[status]}
        `}
      >
        {statusLabels[status]}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-outline-variant border-2 border-surface-container-lowest"
      />

      {/* Teach-back Popover */}
      {showPopover && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-ghost whitespace-nowrap hover:bg-primary/90 active:scale-95 transition-all"
            onClick={() => router.push(`/session?conceptId=${data.id}`)}
          >
            <span className="text-base leading-none">▶</span>
            Start Teach-back
          </button>
          {/* Arrow pointing up */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 rounded-sm" />
        </div>
      )}
    </motion.div>
  );
}

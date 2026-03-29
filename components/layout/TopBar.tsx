"use client";

import { ReactNode } from "react";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  useSidebar,
} from "./SidebarContext";

export interface TopBarProps {
  projectName?: string;
  actions?: ReactNode;
}

export function TopBar({ projectName, actions }: TopBarProps) {
  const { collapsed } = useSidebar();

  return (
    <header
      className="fixed top-0 right-0 h-16 flex justify-between items-center px-8 z-40 bg-transparent transition-[left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ left: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
    >
      {/* Left side - Wordmark and Project Badge */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-black tracking-tight text-[#121826]">Proofboard</span>
        {projectName && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-outline/80">
            {projectName}
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}

"use client";

import { useSidebar } from "./SidebarContext";
import { ReactNode } from "react";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "./SidebarContext";

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export function MainContent({ children, className = "" }: MainContentProps) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={`relative z-10 pt-16 h-screen transition-[margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{ marginLeft: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
    >
      {children}
    </main>
  );
}

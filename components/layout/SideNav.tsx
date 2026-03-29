"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  useSidebar,
} from "./SidebarContext";

export interface SideNavProps {
  user: { name: string; role: string };
}

interface NavItem {
  step: "upload" | "canvas" | "session" | "result";
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { step: "upload",  label: "Upload",  icon: "cloud_upload", href: "/upload"   },
  { step: "canvas",  label: "Canvas",  icon: "account_tree", href: "/canvas"   },
  { step: "session", label: "Session", icon: "mic",          href: "/session" },
  { step: "result",  label: "Result",  icon: "verified",     href: "/result"   },
];

export function SideNav({ user }: SideNavProps) {
  const pathname   = usePathname();
  const activeStep = pathname.split("/")[1] || "upload";
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <nav
      className="fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/50 bg-white shadow-lg transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-16 w-full items-center justify-center border-b border-outline-variant/20 transition-colors hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined text-2xl text-outline">
          {collapsed ? "menu" : "close"}
        </span>
      </button>

      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div
          className={`mb-5 flex items-center overflow-hidden rounded-2xl bg-surface-container-low transition-[padding,gap,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2.5 py-2.5"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[18px]">neurology</span>
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              collapsed ? "max-w-0 -translate-x-2 opacity-0" : "max-w-[7rem] translate-x-0 opacity-100"
            }`}
            aria-hidden={collapsed}
          >
            <div className="text-xs font-black uppercase tracking-[0.16em] text-on-surface">
              Proofboard
            </div>
            <div className="text-[10px] text-on-surface-variant">
              Say it out loud
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeStep === item.step;
            return (
              <Link
                key={item.step}
                href={item.href}
                className={`
                  flex items-center rounded-xl font-semibold transition-[padding,gap,background-color,color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${collapsed ? "justify-center px-0 py-3" : "gap-2.5 px-2.5 py-3"}
                  ${isActive
                    ? "text-primary bg-primary-fixed/50"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                  }
                `}
              >
                <span
                  className="material-symbols-outlined shrink-0 text-[20px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    collapsed ? "max-w-0 translate-x-1 opacity-0" : "max-w-[5rem] translate-x-0 opacity-100"
                  }`}
                  aria-hidden={collapsed}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-2 border-t border-outline-variant/20">
        <div
          className={`flex items-center overflow-hidden bg-surface-container-low transition-[padding,border-radius,gap] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            collapsed ? "justify-center rounded-2xl p-2" : "gap-3 rounded-full p-2"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              collapsed ? "max-w-0 translate-x-1 opacity-0" : "max-w-[5.25rem] translate-x-0 opacity-100"
            }`}
            aria-hidden={collapsed}
          >
            <span className="block text-sm font-bold text-on-surface truncate">
              {user.name}
            </span>
            <span className="block text-xs text-on-surface-variant truncate">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

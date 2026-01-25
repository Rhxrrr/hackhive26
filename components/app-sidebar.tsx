"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Settings,
  HelpCircle,
  BarChart3,
  Users,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload Call", href: "/upload", icon: Upload },
  { name: "Call Reviews", href: "/reviews", icon: Headphones },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Team", href: "/team", icon: Users },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Calm Grid Background - aligned to main content (right of sidebar) */}
      <div
        className="fixed top-0 right-0 bottom-0 left-56 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 0",
        }}
      />

      <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link
            href="/"
            className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shrink-0 overflow-visible">
              <img
                src="/qai-logo.png"
                alt="QAI"
                className="h-28 w-28 object-contain"
              />
            </div>
            <span className="text-base font-semibold text-sidebar-foreground">
              QAI
            </span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-0.5 px-2 py-3">
            <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Main Menu
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="border-t border-sidebar-border px-2 py-3">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  Jane Doe
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  QA Manager
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

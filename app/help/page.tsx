"use client";

import { AppSidebar } from "@/components/app-sidebar";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <AppSidebar />
      <main className="pl-56 relative z-10">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <h1 className="text-lg font-semibold text-foreground">Help</h1>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            Help and documentation will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Silk from "@/components/Silk";
import RotatingText from "@/components/RotatingText";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type AccountRole = "agent" | "manager";
type Account = {
  id: "john" | "jane";
  name: "John.D" | "Jane.D";
  role: AccountRole;
  roleLabel: "Agent" | "Manager";
};

const ACCOUNTS: Account[] = [
  { id: "john", name: "John.D", role: "agent", roleLabel: "Agent" },
  { id: "jane", name: "Jane.D", role: "manager", roleLabel: "Manager" },
];

const STORAGE_KEY = "qai-selected-account";

export default function HomePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Account> | null;
      if (!parsed || (parsed.id !== "john" && parsed.id !== "jane")) return;
      const found = ACCOUNTS.find((a) => a.id === parsed.id) ?? null;
      setAccount(found);
    } catch {
      // ignore
    }
  }, []);

  const loginLabel = useMemo(() => (account ? account.name : "Login"), [account]);

  const selectAccount = (next: Account) => {
    setAccount(next);
    setAccountDialogOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: next.id }));
    } catch {
      // ignore
    }
  };

  const signOut = () => {
    setAccount(null);
    setAccountDialogOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const goDiscovery = () => {
    if (!account) {
      setAccountDialogOpen(true);
      return;
    }
    router.push(account.role === "manager" ? "/dashboard" : "/live");
  };

  return (
    <div className="bg-background">
      {/* Silk Component - Full Screen */}
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Silk
          speed={5}
          scale={1}
          color="#1D006D"
          noiseIntensity={1.5}
          rotation={0}
        />

        {/* Glass nav (overlay) */}
        <header className="fixed top-4 left-0 right-0 z-30 px-4">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md shadow-lg shadow-black/20">
              <div className="grid grid-cols-3 items-center px-3 py-2">
                <div />
                <nav className="flex items-center justify-center gap-1.5">
                  {["Home", "About", "Pricing"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={goDiscovery}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Discovery
                  </button>
                </nav>
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => setAccountDialogOpen(true)}
                  >
                    {loginLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-8">
          <div className="text-center">
            <h1
              className="text-4xl md:text-5xl font-black text-white flex flex-wrap items-center justify-center gap-2"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900 }}
            >
              <span>Enhancing QA</span>
              <RotatingText
                texts={[
                  "Performance.",
                  "Accuracy.",
                  "Intelligence.",
                  "Analytics.",
                  "Precision.",
                  "Reporting.",
                ]}
                mainClassName="text-4xl md:text-5xl font-black text-white/90 whitespace-nowrap px-3 md:px-4 py-1 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md shadow-md shadow-black/15 overflow-hidden"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/80 max-w-3xl mx-auto">
            QAI transforms manual oversight into instant, data-driven performance insights through the power of Applied AI.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={goDiscovery}
              className="bg-white text-black flex items-center justify-center gap-2 px-6 py-3 text-base w-48 border border-white/30 shadow-lg rounded-full hover:bg-white/90 transition-colors"
            >
              Discovery
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select an account</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              {ACCOUNTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAccount(a)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {a.name}
                      </p>
                      <span className="text-[11px] rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
                        {a.roleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Continue as {a.roleLabel.toLowerCase()}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {account && (
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
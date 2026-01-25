"use client";

import React from "react";
import Silk from "@/components/Silk";
import Link from "next/link";
import RotatingText from "@/components/RotatingText";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function HomePage() {
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
                  {["Home", "About", "Pricing", "Discovery"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => {}}
                  >
                    Login
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
              QAI transfroms manual over sight into instant data driven performance insight
            </p>
          </div>
          <div className="flex justify-center">
            <Link href="/dashboard" prefetch={true}>
              <button className="bg-white text-black flex items-center justify-center gap-2 px-6 py-3 text-base w-48 border border-white/30 shadow-lg rounded-full hover:bg-white/90 transition-colors">
                Discovery
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React from "react";
import Silk from "@/components/Silk";
import BlurText from "@/components/BlurText";
import Link from "next/link";

export default function HomePage() {
  const handleAnimationComplete = () => {
    console.log("Animation completed!");
  };

  return (
    <div className="bg-background">
      {/* Silk Component - Full Screen */}
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Silk
          speed={5}
          scale={1}
          color="#1D006D"
          noiseIntensity={1.5}
          rotation={0}
        />

        {/* Content - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-8">
          <div className="text-center">
            <h1
              className="text-4xl md:text-5xl font-black mb-6 flex justify-center"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900 }}
            >
              <BlurText
                text="QAI"
                delay={100}
                animateBy="letters"
                direction="top"
                className="text-4xl md:text-5xl font-black text-white"
              />
            </h1>
            <BlurText
              text="Enhancing QA Performance."
              delay={200}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-xl md:text-2xl text-white/90 mx-auto justify-center"
            />
          </div>
          <div className="flex justify-center">
            <Link href="/dashboard" prefetch={true}>
              <button className="bg-white text-black flex items-center justify-center space-x-2 px-6 py-3 text-base w-48 border border-white/30 shadow-lg rounded-full hover:bg-white/90 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Silk from "@/components/Silk";
import GradientText from "@/components/GradientText";
import BlurText from "@/components/BlurText";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import Link from "next/link";

export default function HomePage() {
  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

  return (
    <div className="bg-background">
      {/* Silk Component - Full Screen */}
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Silk
          speed={5}
          scale={1}
          color="#0f8bff"
          noiseIntensity={1.5}
          rotation={0}
        />
        
        {/* Glass Card - Centered */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 max-w-4xl w-full min-h-[400px] flex flex-col justify-center shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black mb-6" style={{ fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 900 }}>
                <GradientText
                  colors={["#2E00AD", "#0CEDF9"]} /* Shades of blue gradient */
                  animationSpeed={8}
                  showBorder={false}
                  className="font-black"
                >
                  QAI
                </GradientText>
              </h1>
              <BlurText
                text="Enhancing QA Performance"
                delay={200}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="text-xl md:text-2xl text-white/90 mx-auto justify-center"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/manager" prefetch={true}>
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="bg-white/10 text-white flex items-center justify-center space-x-2 px-6 py-3 text-base w-48"
                >
                  <span>Manager Portal</span>
                </HoverBorderGradient>
              </Link>
              <Link href="/agent" prefetch={true}>
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="bg-white/10 text-white flex items-center justify-center space-x-2 px-6 py-3 text-base w-48"
                >
                  <span>Agent Portal</span>
                </HoverBorderGradient>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Iridescence from "@/components/Iridescence";

export default function HomePage() {
  return (
    <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
      <Iridescence
        speed={1}
        amplitude={0.1}
        mouseReact
      />
    </div>
  );
}

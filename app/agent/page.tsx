"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AgentPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Agent Portal</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to the Agent Portal
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

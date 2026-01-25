"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import AnimatedList from "@/components/AnimatedList";
import CountUp from "@/components/CountUp";

// Mock data for today's team performance
const mockTeamScores = [
  {
    category: "Greeting & Introduction",
    score: 92,
    target: 85,
    status: "excellent",
  },
  { category: "Active Listening", score: 88, target: 85, status: "excellent" },
  {
    category: "Problem Resolution",
    score: 75,
    target: 85,
    status: "needs-improvement",
  },
  { category: "Product Knowledge", score: 90, target: 85, status: "excellent" },
  { category: "Empathy", score: 82, target: 85, status: "needs-improvement" },
  { category: "Call Closure", score: 95, target: 85, status: "excellent" },
];

// Mock data for Top 3 / Bottom 3 agents
const mockTopAgents = [
  { name: "Sarah Johnson", initials: "SJ", overall: 94, change: 3.2 },
  { name: "Michael Lee", initials: "ML", overall: 92, change: 1.8 },
  { name: "Emily Davis", initials: "ED", overall: 91, change: 2.5 },
];

const mockBottomAgents = [
  { name: "James Wilson", initials: "JW", overall: 68, change: -2.1 },
  { name: "Lisa Anderson", initials: "LA", overall: 71, change: 1.2 },
  { name: "Robert Brown", initials: "RB", overall: 73, change: -0.8 },
];

const mockCategoriesNeedingImprovement = [
  { category: "Problem Resolution", score: 75, target: 85 },
  { category: "Call Closing", score: 78, target: 85 },
  { category: "Upselling", score: 80, target: 85 },
];

function TeamScoreToday() {
  const [categories, setCategories] = useState<string[]>([]);
  const [teamScores, setTeamScores] = useState(mockTeamScores);

  useEffect(() => {
    // Get categories from localStorage (rubric)
    const rubricData = localStorage.getItem("qa-rubric-file");
    if (rubricData) {
      try {
        const parsed = JSON.parse(rubricData);
        if (parsed.categories) {
          setCategories(parsed.categories);
          // Update team scores to match rubric categories
          const updatedScores = parsed.categories.map((cat: string) => {
            const existing = mockTeamScores.find((s) => s.category === cat);
            if (existing) return existing;
            // Generate random score for new categories
            const score = Math.floor(Math.random() * 30) + 70;
            return {
              category: cat,
              score,
              target: 85,
              status: score >= 85 ? "excellent" : "needs-improvement",
            };
          });
          setTeamScores(updatedScores);
        }
      } catch (e) {
        console.error("Error parsing rubric data:", e);
      }
    } else {
      // Use default categories
      setCategories(mockTeamScores.map((s) => s.category));
    }
  }, []);

  const overallScore = Math.round(
    teamScores.reduce((sum, cat) => sum + cat.score, 0) / teamScores.length,
  );
  const excellentCategories = teamScores.filter(
    (c) => c.status === "excellent",
  );
  const needsImprovementCategories = teamScores.filter(
    (c) => c.status === "needs-improvement",
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-success border-success/30 bg-success/5";
      case "good":
        return "text-blue-500 border-blue-500/30 bg-blue-500/5";
      case "needs-improvement":
        return "text-warning border-warning/30 bg-warning/5";
      default:
        return "text-muted-foreground border-border bg-card";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "needs-improvement":
        return <TrendingDown className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="grid grid-cols-[1fr_2fr] gap-4 items-start">
        <h2 className="text-xl font-semibold text-foreground">
          Team Score This Month
        </h2>
        <h2 className="text-xl font-semibold text-foreground">
          Category Performance
        </h2>
        {/* Left Side - Summary Stats */}
        <div className="space-y-2">
            <div className="rounded-lg border border-border bg-card p-3 mb-1.5">
              <p className="text-sm text-muted-foreground mb-1">
                Overall Score
              </p>
              <p
                className={`text-3xl font-bold ${
                  overallScore >= 85
                    ? "text-success"
                    : overallScore >= 75
                      ? "text-blue-500"
                      : "text-warning"
                }`}
              >
                <CountUp
                  from={0}
                  to={overallScore}
                  direction="up"
                  duration={1}
                  startWhen={true}
                />
                %
              </p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-xs font-medium text-success">Excelling</p>
              </div>
              <p className="text-xl font-bold text-success">
                {excellentCategories.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                categories above target
              </p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-xs font-medium text-warning">
                  Needs Attention
                </p>
              </div>
              <p className="text-xl font-bold text-warning">
                {needsImprovementCategories.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                categories below target
              </p>
            </div>
          </div>

        {/* Right Side - Category Breakdown */}
        <div className="space-y-1.5">
          <AnimatedList
              showGradients={false}
              enableArrowNavigation
              displayScrollbar
              className="w-full"
              onItemSelect={(item, index) => {
                // Optional: handle item selection
                console.log("Selected:", item, index);
              }}
            >
              {teamScores.map((item, index) => {
                const percentage = item.score;
                const isAboveTarget = item.score >= item.target;

                return (
                  <div key={index} className="w-full">
                    <div
                      className={`rounded-lg border p-2.5 ${getStatusColor(item.status)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(item.status)}
                          <p className="text-xs font-medium text-foreground">
                            {item.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            Target: {item.target}%
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isAboveTarget ? "text-success" : "text-warning"
                            }`}
                          >
                            {item.score}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            isAboveTarget ? "bg-success" : "bg-warning"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </AnimatedList>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <AppSidebar />

      {/* Main Content */}
      <main className="pl-56 relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Top 3 & Bottom 3 Agents */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top 3 Agents */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <h2 className="text-base font-semibold text-foreground">
                    Top 3 Agents
                  </h2>
                </div>
                <div className="space-y-3">
                  {mockTopAgents.map((agent, i) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-xs font-bold text-success">
                          {i + 1}
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/20 text-sm font-semibold text-success">
                          {agent.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {agent.name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-success">
                            <TrendingUp className="h-3 w-3" />
                            +{agent.change}% this month
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-lg font-bold text-success">
                        {agent.overall}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 3 Agents */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-4 w-4 text-warning" />
                  <h2 className="text-base font-semibold text-foreground">
                    Bottom 3 Agents
                  </h2>
                </div>
                <div className="space-y-3">
                  {mockBottomAgents.map((agent, i) => (
                    <div
                      key={agent.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">
                          {3 - i}
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/20 text-sm font-semibold text-warning">
                          {agent.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {agent.name}
                          </p>
                          <p
                            className={`flex items-center gap-1 text-xs ${
                              agent.change >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {agent.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {agent.change >= 0 ? "+" : ""}
                            {agent.change}% this month
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-lg font-bold text-warning">
                        {agent.overall}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Score Today */}
            <TeamScoreToday />

            {/* Categories Needing Improvement */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h2 className="text-xl font-semibold text-foreground">
                  Categories Needing Improvement
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {mockCategoriesNeedingImprovement.map((item) => {
                  const diffFromTarget = item.target - item.score;
                  return (
                    <div
                      key={item.category}
                      className="rounded-xl border border-warning/40 bg-card p-4"
                    >
                      <p className="text-sm font-medium text-foreground mb-1">
                        {item.category}
                      </p>
                      <p className="text-2xl font-bold text-warning mb-0.5">
                        {item.score}%
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Target: {item.target}%
                      </p>
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-warning/80 text-warning-foreground mb-3">
                        -{diffFromTarget}% from target
                      </span>
                      <div className="w-full h-2 rounded-full bg-muted flex overflow-hidden">
                        <div
                          className="h-full bg-warning shrink-0"
                          style={{ width: `${item.score}%` }}
                        />
                        <div
                          className="h-full bg-destructive shrink-0"
                          style={{ width: `${diffFromTarget}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

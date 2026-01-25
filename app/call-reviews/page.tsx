"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Filter,
  Calendar,
  SlidersHorizontal,
  User,
  Clock,
  Flag,
  Play,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const statusPills = [
  { label: "5 total calls", count: 5, variant: "muted" as const },
  { label: "1 processing", count: 1, variant: "processing" as const },
  { label: "1 ready", count: 1, variant: "ready" as const },
  { label: "2 needs attention", count: 2, variant: "needsAttention" as const },
  { label: "1 completed", count: 1, variant: "completed" as const },
]

const allCallsData = [
  { id: "1", agentId: "marcus-chen" as const, agent: { initials: "MC", name: "Marcus Chen" }, customer: "Sarah Williams", date: "2026-01-24", duration: "12:34", score: 78, flaggedCount: 3, status: "Needs Attention" as const },
  { id: "2", agentId: "marcus-chen" as const, agent: { initials: "MC", name: "Marcus Chen" }, customer: "James Mitchell", date: "2026-01-23", duration: "08:12", score: 92, flaggedCount: 1, status: "Ready for Review" as const },
  { id: "3", agentId: "marcus-chen" as const, agent: { initials: "MC", name: "Marcus Chen" }, customer: "Rebecca Torres", date: "2026-01-22", duration: "15:45", score: 85, flaggedCount: 5, status: "Completed" as const },
  { id: "4", agentId: "marcus-chen" as const, agent: { initials: "MC", name: "Marcus Chen" }, customer: "Amanda Foster", date: "2026-01-21", duration: "06:20", score: 65, flaggedCount: 2, status: "Needs Attention" as const },
  { id: "5", agentId: "marcus-chen" as const, agent: { initials: "MC", name: "Marcus Chen" }, customer: "Daniel Kim", date: "2026-01-20", duration: "10:00", score: null, flaggedCount: null, status: "Processing" as const },
  { id: "6", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "Michael Brown", date: "2026-01-24", duration: "11:20", score: 84, flaggedCount: 1, status: "Completed" as const },
  { id: "7", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "Lisa Anderson", date: "2026-01-22", duration: "09:45", score: 79, flaggedCount: 2, status: "Needs Attention" as const },
  { id: "8", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "David Park", date: "2026-01-20", duration: "14:10", score: 88, flaggedCount: 0, status: "Completed" as const },
  { id: "9", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "Jennifer Lee", date: "2026-01-18", duration: "08:30", score: 91, flaggedCount: 0, status: "Completed" as const },
  { id: "10", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "Robert Martinez", date: "2026-01-16", duration: "12:05", score: 72, flaggedCount: 3, status: "Needs Attention" as const },
  { id: "11", agentId: "sarah-mitchell" as const, agent: { initials: "SM", name: "Sarah Mitchell" }, customer: "Amanda White", date: "2026-01-14", duration: "07:15", score: 86, flaggedCount: 0, status: "Completed" as const },
]

function getScoreClass(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 90) return "text-emerald-500"
  if (score >= 70) return "text-amber-500"
  return "text-red-500"
}

function getStatusPillClass(
  status: "Needs Attention" | "Ready for Review" | "Completed" | "Processing"
): string {
  switch (status) {
    case "Processing":
      return "bg-blue-600 text-white"
    case "Ready for Review":
      return "bg-emerald-600 text-white"
    case "Needs Attention":
      return "bg-amber-600 text-white"
    case "Completed":
      return "bg-zinc-600 text-zinc-200"
    default:
      return "bg-zinc-600 text-zinc-200"
  }
}

function getPillVariantClass(
  variant: "muted" | "processing" | "ready" | "needsAttention" | "completed"
): string {
  switch (variant) {
    case "processing":
      return "bg-blue-600 text-white"
    case "ready":
      return "bg-emerald-600 text-white"
    case "needsAttention":
      return "bg-amber-600 text-white"
    case "completed":
      return "bg-zinc-600 text-zinc-200"
    case "muted":
    default:
      return "bg-zinc-700 text-zinc-200"
  }
}

const agentFilterOptions = [
  { value: "all-agents", label: "All Agents" },
  { value: "marcus-chen", label: "Marcus Chen" },
  { value: "sarah-mitchell", label: "Sarah Mitchell" },
] as const

export default function CallReviewsPage() {
  const [search, setSearch] = useState("")
  const searchParams = useSearchParams()
  const agentFromUrl = searchParams.get("agent")
  const [agentFilter, setAgentFilter] = useState<string>(() =>
    agentFromUrl === "marcus-chen" || agentFromUrl === "sarah-mitchell" ? agentFromUrl : "all-agents"
  )

  useEffect(() => {
    if (agentFromUrl === "marcus-chen" || agentFromUrl === "sarah-mitchell") {
      setAgentFilter(agentFromUrl)
    } else if (agentFromUrl === null || agentFromUrl === "") {
      setAgentFilter("all-agents")
    }
  }, [agentFromUrl])

  const callsData = useMemo(() => {
    if (agentFilter === "all-agents") return allCallsData
    return allCallsData.filter((c) => c.agentId === agentFilter)
  }, [agentFilter])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Call Reviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and review all uploaded calls
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Select defaultValue="all-status">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready for Review</SelectItem>
                <SelectItem value="needs-attention">Needs Attention</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                {agentFilterOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Date Range"
                className="w-[160px] pl-9"
                readOnly
              />
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => (
              <button
                key={pill.label}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 ${getPillVariantClass(pill.variant)}`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Calls table */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Calls
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {callsData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                            {row.agent.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {row.agent.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {row.customer}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {row.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {row.duration}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-medium ${getScoreClass(row.score)}`}
                        >
                          {row.score !== null ? `${row.score}%` : "-"}
                        </span>
                        {row.flaggedCount != null && (
                          <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Flag className="h-3 w-3" />
                            P {row.flaggedCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusPillClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-foreground hover:bg-muted"
                        asChild
                      >
                        <Link href="/">
                          <Play className="h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

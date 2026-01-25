"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CallsTable } from "@/components/calls-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter,
  Calendar,
  SlidersHorizontal
} from "lucide-react"
import { getStatusColor, getStatusLabel, mockCalls, type CallStatus } from "@/lib/mock-data"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function ReviewsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState<string>(() => searchParams.get("q") ?? "")
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const s = searchParams.get("status")
    if (s === "processing" || s === "ready" || s === "needs_attention" || s === "completed") return s
    return "all"
  })
  const [agentFilter, setAgentFilter] = useState<string>(() => searchParams.get("agent") ?? "all")

  const agentOptions = useMemo(() => {
    const names = Array.from(new Set(mockCalls.map((c) => c.agentName))).sort()
    return names
  }, [])

  const setUrlState = useCallback(
    (next: { q?: string; status?: string; agent?: string }) => {
      const qs = new URLSearchParams(Array.from(searchParams.entries()))

      if (typeof next.q === "string") {
        const v = next.q.trim()
        if (v) qs.set("q", v)
        else qs.delete("q")
      }

      if (typeof next.status === "string") {
        if (next.status && next.status !== "all") qs.set("status", next.status)
        else qs.delete("status")
      }

      if (typeof next.agent === "string") {
        if (next.agent && next.agent !== "all") qs.set("agent", next.agent)
        else qs.delete("agent")
      }

      const suffix = qs.toString()
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Keep state in sync with back/forward navigation + deep links (e.g. from Analytics)
  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    const s = searchParams.get("status")
    const a = searchParams.get("agent") ?? "all"

    setSearch(q)
    setStatusFilter(
      s === "processing" || s === "ready" || s === "needs_attention" || s === "completed" ? s : "all"
    )
    setAgentFilter(agentOptions.includes(a) ? a : "all")
  }, [searchParams, agentOptions])

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase()

    return mockCalls.filter((call) => {
      if (statusFilter !== "all" && call.status !== statusFilter) return false
      if (agentFilter !== "all" && call.agentName !== agentFilter) return false

      if (q.length > 0) {
        const hay = `${call.id} ${call.agentName} ${call.customerName} ${call.date}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  }, [search, statusFilter, agentFilter])

  const counts = useMemo(() => {
    const base: Record<CallStatus, number> = {
      processing: 0,
      ready: 0,
      needs_attention: 0,
      completed: 0,
    }
    for (const c of filteredCalls) base[c.status] += 1
    return base
  }, [filteredCalls])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Call Reviews</h1>
            <p className="text-sm text-muted-foreground">Manage and review all uploaded calls</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      const v = e.target.value
                      setSearch(v)
                      setUrlState({ q: v })
                    }}
                    placeholder="Search calls..."
                    className="h-9 w-72 bg-muted pl-10"
                  />
                </div>
                
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v)
                    setUrlState({ status: v })
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-muted border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">{getStatusLabel("processing")}</SelectItem>
                    <SelectItem value="ready">{getStatusLabel("ready")}</SelectItem>
                    <SelectItem value="needs_attention">{getStatusLabel("needs_attention")}</SelectItem>
                    <SelectItem value="completed">{getStatusLabel("completed")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={agentFilter}
                  onValueChange={(v) => {
                    setAgentFilter(v)
                    setUrlState({ agent: v })
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-muted border-border">
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Agents</SelectItem>
                    {agentOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Button>
              </div>

              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <SlidersHorizontal className="h-4 w-4" />
                More Filters
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {filteredCalls.length} total calls
              </Badge>
              <Badge variant="secondary" className={getStatusColor("processing")}>
                {counts.processing} processing
              </Badge>
              <Badge variant="secondary" className={getStatusColor("ready")}>
                {counts.ready} ready
              </Badge>
              <Badge variant="secondary" className={getStatusColor("needs_attention")}>
                {counts.needs_attention} needs attention
              </Badge>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {counts.completed} completed
              </Badge>
            </div>

            {/* Table */}
            <CallsTable showFilters calls={filteredCalls} />
          </div>
        </div>
      </main>
    </div>
  )
}

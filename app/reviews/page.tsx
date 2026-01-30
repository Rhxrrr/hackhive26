"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/link"
import { Headphones } from "lucide-react"
import { getCalls, type CallRecord } from "@/lib/call-store"

type ReviewStatus = "Pending" | "Ready" | "In Progress" | "Completed"

type CallRow = {
  id: string
  date: string
  agent: string
  customer: string
  duration: string
  status: ReviewStatus
}

const mockCalls: CallRow[] = [
  { id: "1", date: "Jan 24", agent: "Sarah Mitchell", customer: "Michael Brown", duration: "4:32", status: "Ready" },
  { id: "2", date: "Jan 24", agent: "Marcus Chen", customer: "Emily Davis", duration: "3:18", status: "Ready" },
  { id: "3", date: "Jan 23", agent: "Sarah Mitchell", customer: "Sarah Williams", duration: "5:12", status: "Completed" },
  { id: "4", date: "Jan 23", agent: "Marcus Chen", customer: "Amanda Foster", duration: "6:45", status: "Ready" },
  { id: "5", date: "Jan 22", agent: "Sarah Mitchell", customer: "Lisa Anderson", duration: "2:58", status: "In Progress" },
  { id: "6", date: "Jan 22", agent: "Marcus Chen", customer: "James Mitchell", duration: "4:05", status: "Completed" },
  { id: "7", date: "Jan 21", agent: "Sarah Mitchell", customer: "David Park", duration: "7:20", status: "Pending" },
  { id: "8", date: "Jan 21", agent: "Marcus Chen", customer: "Rebecca Torres", duration: "3:42", status: "Ready" },
  { id: "9", date: "Jan 20", agent: "Sarah Mitchell", customer: "Jennifer Lee", duration: "5:55", status: "Completed" },
  { id: "10", date: "Jan 20", agent: "Marcus Chen", customer: "Daniel Kim", duration: "4:10", status: "Ready" },
]

function toCallRow(c: CallRecord): CallRow {
  return { id: c.id, date: c.date, agent: c.agent, customer: c.customer, duration: c.duration, status: c.status }
}

function getStatusClass(status: ReviewStatus): string {
  switch (status) {
    case "Ready":
      return "bg-blue-600/90 text-blue-50"
    case "Pending":
      return "bg-muted text-muted-foreground"
    case "In Progress":
      return "bg-amber-600/90 text-amber-50"
    case "Completed":
      return "bg-emerald-600/90 text-emerald-50"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const STATUS_OPTIONS: ReviewStatus[] = ["Pending", "Ready", "In Progress", "Completed"]

export default function CallReviewsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [storeCalls, setStoreCalls] = useState<CallRow[]>([])
  useEffect(() => {
    setStoreCalls(getCalls().map(toCallRow))
  }, [searchParams])
  const allCalls = storeCalls.length > 0 ? storeCalls : mockCalls
  const statusParam = searchParams.get("status")?.toLowerCase() || ""
  const statusFilter = !statusParam || statusParam === "all"
    ? "all"
    : STATUS_OPTIONS.find((s) => s.toLowerCase() === statusParam) ?? "all"

  const filteredCalls =
    statusFilter === "all"
      ? allCalls
      : allCalls.filter((c) => c.status === statusFilter)

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete("status")
    else params.set("status", value)
    const qs = params.toString()
    router.replace(qs ? `/reviews?${qs}` : "/reviews")
  }

  const selectValue = statusFilter === "all" ? "all" : statusFilter

  return (
    <div className="h-screen overflow-hidden bg-background relative flex flex-col">
      <AppSidebar />
      <main className="pl-56 relative z-10 flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col flex-1 min-h-0 mx-auto max-w-6xl w-full px-4 py-4">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Call Reviews</h1>
              <p className="text-sm text-muted-foreground">Calls to be reviewed for QA</p>
            </div>
            <Select value={selectValue} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-border bg-card flex-1 min-h-0 flex flex-col py-0">
            <CardHeader className="shrink-0 py-4">
              <CardTitle className="text-foreground">Calls to Review</CardTitle>
              <CardDescription>
                {filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""} {statusFilter !== "all" ? `with status "${statusFilter}"` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col p-0 pb-4">
              <div className="flex-1 min-h-0 overflow-auto px-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 pr-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 pr-4 text-left text-sm font-medium text-muted-foreground">Agent</th>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 pr-4 text-left text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 px-2 text-center text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 px-2 text-center text-sm font-medium text-muted-foreground">Status</th>
                      <th className="sticky top-0 z-10 bg-card border-b border-border pb-3 pt-2 pl-2 text-right text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.length === 0 ? (
                      <tr className="border-t border-border">
                        <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          No calls match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredCalls.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="py-3 pr-4 text-sm text-foreground">{row.date}</td>
                          <td className="py-3 pr-4 text-sm text-foreground">{row.agent}</td>
                          <td className="py-3 pr-4 text-sm text-foreground">{row.customer}</td>
                          <td className="py-3 px-2 text-center text-sm text-foreground font-mono">{row.duration}</td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-sm font-medium ${getStatusClass(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right">
                            {row.status === "Ready" || row.status === "Completed" ? (
                              <Link
                                href={storeCalls.some((c) => c.id === row.id) ? `/qa?callId=${encodeURIComponent(row.id)}` : "/qa"}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                                aria-label={row.status === "Completed" ? `View call: ${row.customer}` : `Review call: ${row.customer}`}
                              >
                                <Headphones className="h-4 w-4" />
                                {row.status === "Completed" ? "View" : "Review"}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground/60">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

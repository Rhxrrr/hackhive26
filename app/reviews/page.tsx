"use client"

import { useState } from "react"
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
import { 
  Search, 
  Filter,
  Calendar,
  SlidersHorizontal
} from "lucide-react"

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")

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
                  <input
                    type="text"
                    placeholder="Search calls..."
                    className="h-9 w-72 rounded-lg border border-input bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-muted border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready for Review</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[180px] bg-muted border-border">
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="marcus">Marcus Chen</SelectItem>
                    <SelectItem value="emily">Emily Rodriguez</SelectItem>
                    <SelectItem value="david">David Park</SelectItem>
                    <SelectItem value="lisa">Lisa Wang</SelectItem>
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
                5 total calls
              </Badge>
              <Badge variant="secondary" className="bg-info/20 text-info">
                1 processing
              </Badge>
              <Badge variant="secondary" className="bg-success/20 text-success">
                1 ready
              </Badge>
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                2 needs attention
              </Badge>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                1 completed
              </Badge>
            </div>

            {/* Table */}
            <CallsTable showFilters />
          </div>
        </div>
      </main>
    </div>
  )
}

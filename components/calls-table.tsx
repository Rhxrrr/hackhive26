"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  mockCalls, 
  getStatusColor, 
  getStatusLabel,
  type Call 
} from "@/lib/mock-data"
import { 
  Play, 
  Flag, 
  ChevronRight,
  Clock,
  User
} from "lucide-react"

interface CallsTableProps {
  limit?: number
  showFilters?: boolean
}

export function CallsTable({ limit, showFilters = false }: CallsTableProps) {
  const calls = limit ? mockCalls.slice(0, limit) : mockCalls

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Recent Calls</CardTitle>
        {!showFilters && (
          <Link href="/reviews">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Agent</TableHead>
              <TableHead className="text-muted-foreground">Customer</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Score</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <CallRow key={call.id} call={call} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CallRow({ call }: { call: Call }) {
  return (
    <TableRow className="border-border hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
            {call.agentName.split(" ").map(n => n[0]).join("")}
          </div>
          <span className="font-medium text-foreground">{call.agentName}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          {call.customerName}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{call.date}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {call.duration}
        </div>
      </TableCell>
      <TableCell>
        {call.status === "processing" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${
              call.overallScore >= 80 ? "text-success" :
              call.overallScore >= 60 ? "text-warning" :
              "text-destructive"
            }`}>
              {call.overallScore}%
            </span>
            {call.flaggedItems > 0 && (
              <Badge variant="outline" className="gap-1 border-warning/50 text-warning">
                <Flag className="h-3 w-3" />
                {call.flaggedItems}
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge 
          variant="secondary" 
          className={getStatusColor(call.status)}
        >
          {getStatusLabel(call.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Link href={`/review/${call.id}`}>
          <Button 
            variant="ghost" 
            size="sm"
            disabled={call.status === "processing"}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Review
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}

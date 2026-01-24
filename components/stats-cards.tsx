"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  PhoneCall, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from "lucide-react"

const stats = [
  {
    name: "Total Calls Today",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: PhoneCall,
    description: "vs. yesterday"
  },
  {
    name: "Pending Review",
    value: "8",
    change: "-3",
    trend: "down",
    icon: Clock,
    description: "from last week"
  },
  {
    name: "Needs Attention",
    value: "3",
    change: "+2",
    trend: "up",
    icon: AlertTriangle,
    description: "flagged calls"
  },
  {
    name: "Completed Today",
    value: "16",
    change: "+8",
    trend: "up",
    icon: CheckCircle2,
    description: "reviews done"
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === "up" ? "text-success" : "text-muted-foreground"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

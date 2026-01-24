import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { CallsTable } from "@/components/calls-table"
import { Button } from "@/components/ui/button"
import { Upload, Bell, Search, ClipboardList } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      {/* Main Content */}
      <main className="pl-56">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">QA Call Review Overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search calls..."
                className="h-9 w-64 rounded-lg border border-input bg-muted pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
            </Button>
            <Link href="/upload">
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Upload Call
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
              <QuickActionCard
                title="Pending Reviews"
                count={8}
                description="Calls awaiting QA review"
                href="/reviews?status=ready"
                actionLabel="Start Reviewing"
              />
              <QuickActionCard
                title="Team Analytics"
                count={42}
                description="View team performance metrics"
                href="/analytics"
                actionLabel="View Analytics"
                variant="success"
              />
              <QuickActionCard
                title="QA Rubric"
                count={6}
                description="Manage evaluation criteria"
                href="/rubric"
                actionLabel="Update QA Rubric"
                variant="default"
                icon={ClipboardList}
              />
            </div>

            {/* Recent Calls Table */}
            <CallsTable limit={5} />
          </div>
        </div>
      </main>
    </div>
  )
}

function QuickActionCard({ 
  title, 
  count, 
  description, 
  href, 
  actionLabel,
  variant = "default",
  icon: Icon
}: {
  title: string
  count: number
  description: string
  href: string
  actionLabel: string
  variant?: "default" | "warning" | "success"
  icon?: React.ComponentType<{ className?: string }>
}) {
  const variantStyles = {
    default: "border-border bg-card",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5"
  }

  const countStyles = {
    default: "text-foreground",
    warning: "text-warning",
    success: "text-success"
  }

  return (
    <div className={`rounded-xl border p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <p className={`mt-1 text-3xl font-bold ${countStyles[variant]}`}>{count}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Link href={href}>
        <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent">
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}

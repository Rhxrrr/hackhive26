"use client"

import React, { useRef, useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Upload, ClipboardList, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, FileText, BarChart } from "lucide-react"
import Link from "next/link"
import AnimatedList from "@/components/AnimatedList"
import CountUp from "@/components/CountUp"

// Mock data for today's team performance
const mockTeamScores = [
  { category: "Greeting & Introduction", score: 92, target: 85, status: "excellent" },
  { category: "Active Listening", score: 88, target: 85, status: "excellent" },
  { category: "Problem Resolution", score: 75, target: 85, status: "needs-improvement" },
  { category: "Product Knowledge", score: 90, target: 85, status: "excellent" },
  { category: "Empathy", score: 82, target: 85, status: "needs-improvement" },
  { category: "Call Closure", score: 95, target: 85, status: "excellent" },
]

function TeamScoreToday() {
  const [categories, setCategories] = useState<string[]>([])
  const [teamScores, setTeamScores] = useState(mockTeamScores)

  useEffect(() => {
    // Get categories from localStorage (rubric)
    const rubricData = localStorage.getItem('qa-rubric-file')
    if (rubricData) {
      try {
        const parsed = JSON.parse(rubricData)
        if (parsed.categories) {
          setCategories(parsed.categories)
          // Update team scores to match rubric categories
          const updatedScores = parsed.categories.map((cat: string) => {
            const existing = mockTeamScores.find(s => s.category === cat)
            if (existing) return existing
            // Generate random score for new categories
            const score = Math.floor(Math.random() * 30) + 70
            return {
              category: cat,
              score,
              target: 85,
              status: score >= 85 ? "excellent" : "needs-improvement"
            }
          })
          setTeamScores(updatedScores)
        }
      } catch (e) {
        console.error('Error parsing rubric data:', e)
      }
    } else {
      // Use default categories
      setCategories(mockTeamScores.map(s => s.category))
    }
  }, [])

  const overallScore = Math.round(
    teamScores.reduce((sum, cat) => sum + cat.score, 0) / teamScores.length
  )
  const excellentCategories = teamScores.filter(c => c.status === "excellent")
  const needsImprovementCategories = teamScores.filter(c => c.status === "needs-improvement")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-success border-success/30 bg-success/5"
      case "good":
        return "text-blue-500 border-blue-500/30 bg-blue-500/5"
      case "needs-improvement":
        return "text-warning border-warning/30 bg-warning/5"
      default:
        return "text-muted-foreground border-border bg-card"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <TrendingUp className="h-4 w-4 text-success" />
      case "needs-improvement":
        return <TrendingDown className="h-4 w-4 text-warning" />
      default:
        return null
    }
  }

  return (
    <div>
      <div className="pb-1">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team Score This Month</h2>
        </div>
      </div>
      <div className="pt-1">
        <div className="grid grid-cols-[1fr_2fr] gap-4 items-start">
          {/* Left Side - Summary Stats */}
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-card p-3 mb-1.5">
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <p className={`text-3xl font-bold ${
                overallScore >= 85 ? "text-success" : overallScore >= 75 ? "text-blue-500" : "text-warning"
              }`}>
                <CountUp
                  from={0}
                  to={overallScore}
                  direction="up"
                  duration={1}
                  startWhen={true}
                />%
              </p>
            </div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-xs font-medium text-success">Excelling</p>
              </div>
              <p className="text-xl font-bold text-success">{excellentCategories.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">categories above target</p>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-xs font-medium text-warning">Needs Attention</p>
              </div>
              <p className="text-xl font-bold text-warning">{needsImprovementCategories.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">categories below target</p>
            </div>
          </div>

          {/* Right Side - Category Breakdown */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Category Performance</h3>
            <AnimatedList
              showGradients
              enableArrowNavigation
              displayScrollbar
              className="w-full"
              onItemSelect={(item, index) => {
                // Optional: handle item selection
                console.log('Selected:', item, index)
              }}
            >
              {teamScores.map((item, index) => {
                const percentage = item.score
                const isAboveTarget = item.score >= item.target
                
                return (
                  <div key={index} className="w-full">
                    <div className={`rounded-lg border p-2.5 ${getStatusColor(item.status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(item.status)}
                          <p className="text-xs font-medium text-foreground">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Target: {item.target}%</span>
                          <span className={`text-xs font-bold ${
                            isAboveTarget ? "text-success" : "text-warning"
                          }`}>
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
                )
              })}
            </AnimatedList>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [hasRubric, setHasRubric] = useState(false)
  const rubricFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if rubric file exists in localStorage
    const rubricData = localStorage.getItem('qa-rubric-file')
    setHasRubric(!!rubricData)
    
    // Listen for storage changes (when rubric is saved/removed)
    const handleStorageChange = () => {
      const rubricData = localStorage.getItem('qa-rubric-file')
      setHasRubric(!!rubricData)
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event from rubric page
    window.addEventListener('rubric-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('rubric-updated', handleStorageChange)
    }
  }, [])

  const triggerRubricUpload = () => {
    rubricFileInputRef.current?.click()
  }

  const parseRubricCsvToCategories = (csvText: string): string[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    // Take first column per row (supports comma, tab, or semicolon delimited exports)
    const firstCol = lines.map((line) => {
      const cell = line.split(/,|\t|;/)[0] ?? ""
      return cell.replace(/^["']|["']$/g, "").trim()
    })

    return firstCol
      .map((v) => v.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((v) => v.length > 0)
      .filter((v) => v.toLowerCase() !== "category" && v.toLowerCase() !== "categories")
  }

  const parseRubricRowsToCategories = (rows: unknown[][]): string[] => {
    return rows
      .map((r) => {
        const v = (r?.[0] ?? "") as unknown
        return String(v).replace(/^["']|["']$/g, "").trim()
      })
      .map((v) => v.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((v) => v.length > 0)
      .filter((v) => v.toLowerCase() !== "category" && v.toLowerCase() !== "categories")
  }

  const handleRubricFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const name = file.name.toLowerCase()

      const isCsv = name.endsWith(".csv") || file.type === "text/csv"
      const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls")

      let categories: string[] = []

      if (isCsv) {
        const text = await file.text()
        categories = parseRubricCsvToCategories(text)
      } else if (isExcel) {
        // Optional: supports real Excel files if `xlsx` is installed.
        // Falls back to CSV-only flow if not available.
        try {
          const importer = new Function("m", "return import(m)") as (m: string) => Promise<any>
          const XLSX = await importer("xlsx")
          const buf = await file.arrayBuffer()
          const workbook = XLSX.read(buf, { type: "array" })
          const sheetName = workbook.SheetNames?.[0]
          const sheet = sheetName ? workbook.Sheets?.[sheetName] : null
          const rows = sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]) : []
          categories = parseRubricRowsToCategories(rows)
        } catch {
          alert("To upload .xlsx files, install the `xlsx` package or export the file as CSV (.csv).")
          return
        }
      } else {
        alert("Please upload an Excel file (.xlsx) or CSV export (.csv).")
        return
      }

      if (categories.length === 0) {
        alert("No categories found. Put category names in the first column and try again.")
        return
      }

      localStorage.setItem(
        "qa-rubric-file",
        JSON.stringify({
          categories,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        })
      )
      window.dispatchEvent(new Event("rubric-updated"))
      setHasRubric(true)
    } finally {
      // allow re-uploading the same file
      e.target.value = ""
    }
  }
  return (
    <div className="min-h-screen bg-background relative">
      <AppSidebar />
      
      {/* Calm Grid Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 0'
        }}
      />
      
      {/* Main Content */}
      <main className="pl-56 relative z-10">
        <input
          ref={rubricFileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleRubricFileSelect}
          className="hidden"
        />
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/upload">
              <Button className="gap-2 bg-blue-950/70 hover:bg-blue-950/85 backdrop-blur-md border border-blue-800/30 text-white">
                <Upload className="h-4 w-4" />
                Upload Call
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid gap-3 md:grid-cols-3">
              <QuickActionCard
                title="Pending Reviews"
                count={8}
                description="Calls awaiting QA review"
                href="/reviews?status=ready"
                actionLabel="Start Reviewing"
                variant="info"
                icon={FileText}
              />
              <QuickActionCard
                title="Team Analytics"
                count={42}
                description="View team performance metrics"
                href="/analytics"
                actionLabel="View Analytics"
                variant="info"
                icon={BarChart}
              />
              <QuickActionCard
                title="QA Rubric"
                count={hasRubric ? undefined : undefined}
                description={hasRubric ? "Update evaluation criteria (upload CSV)" : "Add evaluation criteria (upload CSV)"}
                actionLabel={hasRubric ? "Update Rubric" : "Add Rubric"}
                variant="info"
                icon={ClipboardList}
                onAction={triggerRubricUpload}
              />
            </div>

            {/* Team Score Today */}
            <TeamScoreToday />
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
  icon: Icon,
  onAction,
}: {
  title: string
  count?: number
  description: string
  href?: string
  actionLabel: string
  variant?: "default" | "warning" | "success" | "info"
  icon?: React.ComponentType<{ className?: string }>
  onAction?: () => void
}) {
  const variantStyles = {
    default: "border-border bg-card",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
    info: "border-blue-500/30 bg-blue-500/5"
  }

  const countStyles = {
    default: "text-foreground",
    warning: "text-warning",
    success: "text-success",
    info: "text-blue-500"
  }

  return (
    <div className={`rounded-xl border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
          </div>
          {count !== undefined && (
            <p className={`mt-0.5 text-2xl font-bold ${countStyles[variant]}`}>{count}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {href ? (
        <Link href={href}>
          <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent text-xs h-7">
            {actionLabel}
          </Button>
        </Link>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full bg-transparent text-xs h-7"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

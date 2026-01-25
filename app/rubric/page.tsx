"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Save, ArrowLeft, FileText, X } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

const defaultCategories = [
  "Greeting & Introduction",
  "Active Listening",
  "Problem Resolution",
  "Product Knowledge",
  "Empathy & Rapport",
  "Call Closure",
]

export default function RubricPage() {
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasExistingRubric, setHasExistingRubric] = useState(false)

  const parseRubricCsvToCategories = (csvText: string): string[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

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
      .map((r) => String((r?.[0] ?? "") as unknown).replace(/^["']|["']$/g, "").trim())
      .map((v) => v.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((v) => v.length > 0)
      .filter((v) => v.toLowerCase() !== "category" && v.toLowerCase() !== "categories")
  }

  useEffect(() => {
    // Check if rubric file exists in localStorage
    const rubricData = localStorage.getItem('qa-rubric-file')
    if (rubricData) {
      try {
        const parsed = JSON.parse(rubricData)
        setHasExistingRubric(true)
        if (parsed.categories) {
          setCategories(parsed.categories)
        }
        if (parsed.fileName) {
          // Create a mock file object for display
          const mockFile = new File([], parsed.fileName, { type: 'text/plain' })
          setUploadedFile(mockFile)
        }
      } catch (e) {
        console.error('Error parsing rubric data:', e)
      }
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const name = file.name.toLowerCase()
      const isCsv = name.endsWith(".csv") || file.type === "text/csv"
      const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls")

      let parsedCategories: string[] = []

      if (isCsv) {
        const text = await file.text()
        parsedCategories = parseRubricCsvToCategories(text)
      } else if (isExcel) {
        try {
          const importer = new Function("m", "return import(m)") as (m: string) => Promise<any>
          const XLSX = await importer("xlsx")
          const buf = await file.arrayBuffer()
          const workbook = XLSX.read(buf, { type: "array" })
          const sheetName = workbook.SheetNames?.[0]
          const sheet = sheetName ? workbook.Sheets?.[sheetName] : null
          const rows = sheet ? (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]) : []
          parsedCategories = parseRubricRowsToCategories(rows)
        } catch {
          alert("To upload .xlsx files here, install the `xlsx` package or export the file as CSV (.csv).")
          return
        }
      } else {
        alert("Please upload an Excel file (.xlsx) or CSV export (.csv).")
        return
      }

      if (parsedCategories.length === 0) {
        alert("No categories found. Put category names in the first column and try again.")
        return
      }

      setUploadedFile(file)
      setCategories(parsedCategories)
      setHasChanges(false)
      setHasExistingRubric(true)

      localStorage.setItem(
        "qa-rubric-file",
        JSON.stringify({
          categories: parsedCategories,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        })
      )
      window.dispatchEvent(new Event("rubric-updated"))
    } finally {
      e.target.value = ""
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setCategories(defaultCategories)
    setHasChanges(true)
    setHasExistingRubric(false)
    localStorage.removeItem('qa-rubric-file')
    window.dispatchEvent(new Event('rubric-updated'))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = () => {
    // TODO: Save to backend/database
    console.log("Saving rubric categories:", categories)
    if (uploadedFile) {
      console.log("Uploaded file:", uploadedFile.name)
    }
    setHasChanges(false)
    // Show success message
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      <main className="pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">QA Rubric Management</h1>
              <p className="text-sm text-muted-foreground">Configure evaluation criteria for call reviews</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </header>

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>{hasExistingRubric ? "Update QA Rubric" : "Upload QA Rubric"}</CardTitle>
                <CardDescription>
                  Upload an Excel file (.xlsx) or a CSV export (.csv). Put category names in the first column.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="rubric-upload"
                    />
                    <label htmlFor="rubric-upload">
                      <Button asChild variant="outline" className="gap-2 cursor-pointer">
                        <span>
                          <Upload className="h-4 w-4" />
                          {hasExistingRubric ? "Update Rubric File" : "Upload Rubric File"}
                        </span>
                      </Button>
                    </label>
                    {uploadedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveFile}
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Preview Categories */}
                  {categories.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Categories ({categories.length}):
                      </p>
                      <div className="space-y-2">
                        {categories.map((category, index) => (
                          <div
                            key={index}
                            className="flex items-center rounded-lg border border-border bg-muted/50 p-3"
                          >
                            <span className="text-sm text-foreground">{category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">About QA Rubrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The QA rubric defines the evaluation criteria for all call reviews. Each category will be scored 
                  individually, and the overall call quality score will be calculated based on these categories. 
                  Changes to the rubric will apply to all new call reviews going forward.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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
  const [newCategory, setNewCategory] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
      setHasChanges(true)
    }
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleSave = () => {
    // TODO: Save to backend/database
    console.log("Saving rubric categories:", categories)
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
                <CardTitle>Evaluation Categories</CardTitle>
                <CardDescription>
                  Define the categories used to evaluate call quality. These will be applied to all call reviews.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Categories */}
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                    >
                      <span className="text-sm font-medium text-foreground">{category}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCategory(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add New Category */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Input
                    placeholder="Enter new category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addCategory()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={addCategory} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Category
                  </Button>
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

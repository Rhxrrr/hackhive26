"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronUp, 
  Flag, 
  Clock, 
  Edit2, 
  Check,
  X,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type ScoreCategory, getConfidenceColor } from "@/lib/mock-data"

interface ScorecardProps {
  categories: ScoreCategory[]
  onOverride?: (categoryId: string, newScore: number, note: string) => void
  onJumpToTimestamp?: (timestamp: string) => void
}

export function Scorecard({ categories, onOverride, onJumpToTimestamp }: ScorecardProps) {
  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0)
  const maxScore = categories.reduce((sum, cat) => sum + cat.maxScore, 0)
  const percentage = Math.round((totalScore / maxScore) * 100)

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            QA Scorecard
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{totalScore}</span>
            <span className="text-muted-foreground">/ {maxScore}</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-2",
                percentage >= 80 ? "bg-success/20 text-success" :
                percentage >= 60 ? "bg-warning/20 text-warning" :
                "bg-destructive/20 text-destructive"
              )}
            >
              {percentage}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-border">
          {categories.map((category) => (
            <ScoreCategoryCard
              key={category.id}
              category={category}
              onOverride={onOverride}
              onJumpToTimestamp={onJumpToTimestamp}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreCategoryCard({ 
  category, 
  onOverride,
  onJumpToTimestamp 
}: { 
  category: ScoreCategory
  onOverride?: (categoryId: string, newScore: number, note: string) => void
  onJumpToTimestamp?: (timestamp: string) => void
}) {
  const [isOpen, setIsOpen] = useState(category.flagged)
  const [isEditing, setIsEditing] = useState(false)
  const [editScore, setEditScore] = useState(category.qaOverride ?? category.score)
  const [editNote, setEditNote] = useState(category.qaNote ?? "")

  const displayScore = category.qaOverride ?? category.score
  const hasOverride = category.qaOverride !== undefined

  const handleSaveOverride = () => {
    onOverride?.(category.id, editScore, editNote)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditScore(category.qaOverride ?? category.score)
    setEditNote(category.qaNote ?? "")
    setIsEditing(false)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          category.flagged && "bg-warning/5"
        )}>
          <div className="flex items-center gap-3">
            {category.flagged && (
              <Flag className="h-4 w-4 text-warning" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{category.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getConfidenceColor(category.confidence))}
                >
                  {category.confidence} confidence
                </Badge>
                {category.timestamp && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onJumpToTimestamp?.(category.timestamp!)
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {category.timestamp}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={cn(
                "text-lg font-bold",
                displayScore >= category.maxScore * 0.8 ? "text-success" :
                displayScore >= category.maxScore * 0.6 ? "text-warning" :
                "text-destructive"
              )}>
                {displayScore}
                <span className="text-sm text-muted-foreground font-normal">/{category.maxScore}</span>
              </p>
              {hasOverride && (
                <p className="text-xs text-muted-foreground line-through">
                  AI: {category.score}
                </p>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">
          {/* AI Justification */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              AI Justification
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {category.justification}
            </p>
          </div>

          {/* QA Override Section */}
          {isEditing ? (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Override Score
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[editScore]}
                    max={category.maxScore}
                    step={1}
                    onValueChange={(v) => setEditScore(v[0])}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-foreground w-12 text-right">
                    {editScore}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  QA Note
                </label>
                <Textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Add a note explaining your override..."
                  className="resize-none bg-muted border-border"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOverride}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save Override
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {hasOverride && category.qaNote && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-muted-foreground">{category.qaNote}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-auto"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {hasOverride ? "Edit Override" : "Override Score"}
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

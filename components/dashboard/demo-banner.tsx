"use client"

import { X, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exitDemoMode } from "@/app/auth/actions"
import { useState } from "react"

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="font-medium text-primary">Demo Mode</span>
          <span className="text-muted-foreground">
            You&apos;re exploring CareerCompass with sample data. Sign up to save your progress.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <form action={exitDemoMode}>
            <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
              Exit Demo
            </Button>
          </form>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

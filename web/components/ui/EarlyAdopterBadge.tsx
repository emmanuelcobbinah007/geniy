"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles } from "lucide-react"

export function EarlyAdopterBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="ml-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-500/20 transition-colors cursor-default"
          >
            <Sparkles className="w-3 h-3 mr-1 fill-current" />
            Early Adopter
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Early Adopter Status</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

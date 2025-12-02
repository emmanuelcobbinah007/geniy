"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Loader2, Palette } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export interface Theme {
  mode: 'system' | 'custom'
  layout: 'focus' | 'book' | 'deck' | 'terminal'
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  borderRadius: string
}

interface ThemeEditorProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export const DEFAULT_THEME: Theme = {
  mode: 'system',
  layout: 'focus',
  primaryColor: "#7c3aed",
  backgroundColor: "#ffffff",
  textColor: "#18181b",
  accentColor: "#f4f4f5",
  fontFamily: "Inter",
  borderRadius: "0.5rem"
}

const THEME_PRESETS: Record<string, Theme> = {
    "Default": DEFAULT_THEME,
    "Midnight": {
        mode: 'custom',
        layout: 'focus',
        primaryColor: "#6366f1",
        backgroundColor: "#09090b",
        textColor: "#f4f4f5",
        accentColor: "#27272a",
        fontFamily: "Inter",
        borderRadius: "0.75rem"
    },
    "Swiss": {
        mode: 'custom',
        layout: 'focus',
        primaryColor: "#ef4444",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        accentColor: "#f4f4f5",
        fontFamily: "Playfair Display",
        borderRadius: "0px"
    },
    "Neon": {
        mode: 'custom',
        layout: 'focus',
        primaryColor: "#d946ef",
        backgroundColor: "#2e1065",
        textColor: "#e9d5ff",
        accentColor: "#4c1d95",
        fontFamily: "Roboto Mono",
        borderRadius: "1rem"
    },
    "Storybook": {
        mode: 'custom',
        layout: 'book',
        primaryColor: "#8b5cf6",
        backgroundColor: "#fdfbf7", // Warm paper-like
        textColor: "#4a4a4a",
        accentColor: "#e5e5e5",
        fontFamily: "Playfair Display",
        borderRadius: "2px"
    }
}

export function ThemeEditor({ theme, onThemeChange }: ThemeEditorProps) {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleColorChange = (key: keyof Theme, value: string) => {
    onThemeChange({ ...theme, mode: 'custom', [key]: value })
  }

  const handleReset = () => {
    onThemeChange(DEFAULT_THEME)
    toast.success("Theme reset to default")
  }

  const handleGenerateTheme = async () => {
    if (!prompt.trim() || !token) return

    setIsGenerating(true)
    try {
      const newTheme = await api.generateTheme(prompt, token)
      if (newTheme) {
        onThemeChange({
            ...theme, // Keep defaults if missing
            ...newTheme,
            mode: 'custom'
        })
        toast.success("Theme generated!")
      }
    } catch (error) {
      console.error("Failed to generate theme:", error)
      toast.error("Failed to generate theme")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold">Theme Editor</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Reset to Default
        </Button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(THEME_PRESETS).map(([name, preset]) => (
            <button
                key={name}
                onClick={() => onThemeChange(preset)}
                className="group relative flex flex-col items-center gap-1.5 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 transition-all"
            >
                <div 
                    className="w-full aspect-square rounded-md shadow-sm border border-zinc-100 dark:border-zinc-800"
                    style={{ backgroundColor: preset.backgroundColor }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
                    </div>
                </div>
                <span className="text-[10px] md:text-xs font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-violet-600 truncate w-full text-center">{name}</span>
            </button>
        ))}
      </div>

      {/* AI Generator */}
      <div className="space-y-2 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-900/20">
        <Label className="text-violet-700 dark:text-violet-300 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Magic Theme
        </Label>
        <div className="flex gap-2">
            <Input 
                placeholder="e.g. 'Cyberpunk neon', 'Forest vibes', 'Minimalist luxury'" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800"
            />
            <Button 
                onClick={handleGenerateTheme} 
                disabled={isGenerating || !prompt}
                className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
            </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Layout Style</Label>
        <div className="grid grid-cols-2 gap-2">
            {[
                { id: 'focus', name: 'Focus', icon: '🎯' },
                { id: 'book', name: 'Storybook', icon: '📖' },
                { id: 'deck', name: 'Deck', icon: '🃏' },
                { id: 'terminal', name: 'Terminal', icon: '💻' }
            ].map((layout) => (
                <button
                    key={layout.id}
                    onClick={() => handleColorChange("layout", layout.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        theme.layout === layout.id 
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <span className="text-xl">{layout.icon}</span>
                    <span className="text-sm font-medium">{layout.name}</span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                    <Input 
                        type="color" 
                        value={theme.primaryColor} 
                        onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                        value={theme.primaryColor} 
                        onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                        className="font-mono"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Background</Label>
                <div className="flex gap-2">
                    <Input 
                        type="color" 
                        value={theme.backgroundColor} 
                        onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                        value={theme.backgroundColor} 
                        onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                        className="font-mono"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                    <Input 
                        type="color" 
                        value={theme.textColor} 
                        onChange={(e) => handleColorChange("textColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                        value={theme.textColor} 
                        onChange={(e) => handleColorChange("textColor", e.target.value)}
                        className="font-mono"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                    <Input 
                        type="color" 
                        value={theme.accentColor} 
                        onChange={(e) => handleColorChange("accentColor", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                        value={theme.accentColor} 
                        onChange={(e) => handleColorChange("accentColor", e.target.value)}
                        className="font-mono"
                    />
                </div>
            </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
            <Label>Font Family</Label>
            <Select value={theme.fontFamily} onValueChange={(v) => handleColorChange("fontFamily", v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Inter">Inter (Clean)</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                    <SelectItem value="Roboto Mono">Roboto Mono (Tech)</SelectItem>
                    <SelectItem value="Comic Sans MS">Comic Sans (Playful)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
            <Label>Border Radius ({theme.borderRadius})</Label>
            <Slider 
                min={0} 
                max={24} 
                step={2}
                value={[parseInt(theme.borderRadius) || 0]}
                onValueChange={(v) => handleColorChange("borderRadius", `${v[0]}px`)}
            />
        </div>
      </div>
    </div>
  )
}

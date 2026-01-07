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
import { Sparkles, Loader2, Image as ImageIcon, Type, Square, Palette } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface Theme {
  mode: 'system' | 'custom'
  layout: 'focus' | 'book' | 'deck' | 'terminal'
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  borderRadius: string
  // Enhanced styling options
  backgroundImage?: string
  backgroundOverlay?: number
  buttonStyle?: 'filled' | 'outline' | 'soft' | 'pill'
  logoUrl?: string
  logoPosition?: 'top-left' | 'top-center' | 'top-right' | 'none'
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
  borderRadius: "0.5rem",
  backgroundImage: "",
  backgroundOverlay: 40,
  buttonStyle: "filled",
  logoUrl: "",
  logoPosition: "none"
}

const PRESET_COLORS = [
  "#7c3aed", "#6366f1", "#3b82f6", "#0ea5e9", "#14b8a6",
  "#22c55e", "#eab308", "#f97316", "#ef4444", "#ec4899",
  "#8b5cf6", "#000000"
]

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Roboto Mono", label: "Roboto Mono" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "DM Sans", label: "DM Sans" },
]

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
]

type TabKey = 'logo' | 'font' | 'buttons' | 'background'

export function ThemeEditor({ theme, onThemeChange }: ThemeEditorProps) {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('font')
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBg, setIsUploadingBg] = useState(false)

  const handleChange = (key: keyof Theme, value: any) => {
    onThemeChange({ ...theme, mode: 'custom', [key]: value })
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'background') => {
    if (!token) {
      toast.error("Please sign in to upload files")
      return
    }
    
    const setUploading = type === 'logo' ? setIsUploadingLogo : setIsUploadingBg
    const themeKey = type === 'logo' ? 'logoUrl' : 'backgroundImage'
    
    setUploading(true)
    try {
      const result = await api.uploadAsset(file, token)
      if (result.url) {
        handleChange(themeKey, result.url)
        toast.success(`${type === 'logo' ? 'Logo' : 'Background'} uploaded!`)
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error)
      toast.error(`Failed to upload ${type}`)
    } finally {
      setUploading(false)
    }
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
            ...theme,
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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'logo', label: 'Logo', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'font', label: 'Font', icon: <Type className="w-4 h-4" /> },
    { key: 'buttons', label: 'Buttons', icon: <Square className="w-4 h-4" /> },
    { key: 'background', label: 'Background', icon: <Palette className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 px-3 py-3 text-sm font-medium transition-all relative",
              activeTab === tab.key 
                ? "text-zinc-900 dark:text-white" 
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Logo Tab */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Logo</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'logo')
                  }}
                  disabled={isUploadingLogo}
                />
                <div className={cn(
                  "flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed transition-all",
                  isUploadingLogo 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" 
                    : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
                  theme.logoUrl && "border-solid"
                )}>
                  {isUploadingLogo ? (
                    <div className="flex items-center gap-2 text-violet-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : theme.logoUrl ? (
                    <img 
                      src={theme.logoUrl} 
                      alt="Logo" 
                      className="h-12 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                    />
                  ) : (
                    <div className="text-center text-zinc-500">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-sm">Click to upload logo</span>
                    </div>
                  )}
                </div>
              </div>
              {theme.logoUrl && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-zinc-500"
                  onClick={() => handleChange("logoUrl", "")}
                >
                  Remove logo
                </Button>
              )}
            </div>
            
            {theme.logoUrl && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Position</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'top-left', label: 'Left' },
                    { value: 'top-center', label: 'Center' },
                    { value: 'top-right', label: 'Right' },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => handleChange("logoPosition", pos.value)}
                      className={cn(
                        "flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all",
                        theme.logoPosition === pos.value
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                      )}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Font Tab */}
        {activeTab === 'font' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Font</Label>
              <Select value={theme.fontFamily} onValueChange={(v) => handleChange("fontFamily", v)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Text Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {["#000000", "#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#ffffff"].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange("textColor", color)}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      theme.textColor === color ? "border-violet-500 scale-110" : "border-zinc-200 dark:border-zinc-700"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Buttons Tab */}
        {activeTab === 'buttons' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Button Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange("primaryColor", color)}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      theme.primaryColor === color ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Button Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'filled', label: 'Filled' },
                  { value: 'outline', label: 'Outline' },
                  { value: 'soft', label: 'Soft' },
                  { value: 'pill', label: 'Pill' },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => handleChange("buttonStyle", style.value)}
                    className={cn(
                      "py-2.5 px-4 text-sm font-medium rounded-lg border transition-all",
                      theme.buttonStyle === style.value
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Corner Radius</Label>
              <div className="flex gap-2">
                {[
                  { value: '0px', label: 'Sharp' },
                  { value: '8px', label: 'Rounded' },
                  { value: '16px', label: 'Soft' },
                ].map((radius) => (
                  <button
                    key={radius.value}
                    onClick={() => handleChange("borderRadius", radius.value)}
                    className={cn(
                      "flex-1 py-2 px-3 text-sm font-medium border transition-all",
                      theme.borderRadius === radius.value
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                    )}
                    style={{ borderRadius: radius.value }}
                  >
                    {radius.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Background Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {["#ffffff", "#fafafa", "#f4f4f5", "#18181b", "#09090b", "#000000"].map((color) => (
                  <button
                    key={color}
                    onClick={() => { handleChange("backgroundColor", color); handleChange("backgroundImage", ""); }}
                    className={cn(
                      "w-full aspect-square rounded-lg border-2 transition-all",
                      theme.backgroundColor === color && !theme.backgroundImage 
                        ? "border-violet-500 scale-110" 
                        : "border-zinc-200 dark:border-zinc-700"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Gradient</Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADIENT_PRESETS.map((gradient, i) => (
                  <button
                    key={i}
                    onClick={() => handleChange("backgroundImage", gradient)}
                    className={cn(
                      "w-full aspect-video rounded-lg border-2 transition-all",
                      theme.backgroundImage === gradient 
                        ? "border-violet-500 scale-105" 
                        : "border-transparent"
                    )}
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            </div>

            {theme.backgroundImage && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Overlay</Label>
                  <span className="text-sm text-zinc-500">{theme.backgroundOverlay}%</span>
                </div>
                <Slider 
                  min={0} 
                  max={80} 
                  step={5}
                  value={[theme.backgroundOverlay || 40]}
                  onValueChange={(v) => handleChange("backgroundOverlay", v[0])}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Image</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file, 'background')
                  }}
                  disabled={isUploadingBg}
                />
                <div className={cn(
                  "flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed transition-all overflow-hidden",
                  isUploadingBg 
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" 
                    : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400",
                  theme.backgroundImage?.startsWith('http') && "border-solid"
                )}>
                  {isUploadingBg ? (
                    <div className="flex items-center gap-2 text-violet-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : theme.backgroundImage?.startsWith('http') ? (
                    <img 
                      src={theme.backgroundImage} 
                      alt="Background preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-zinc-500">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                </div>
              </div>
              {theme.backgroundImage?.startsWith('http') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-zinc-500"
                  onClick={() => handleChange("backgroundImage", "")}
                >
                  Remove image
                </Button>
              )}
            </div>
          </div>
        )}

        
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Revert
        </Button>
      </div>
    </div>
  )
}

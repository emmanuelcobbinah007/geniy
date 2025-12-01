"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Table } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface ExportButtonProps {
  campaignName: string
  responses: any[]
  targetElementId: string // ID of the element to capture for PDF
}

export function ExportButton({ campaignName, responses, targetElementId }: ExportButtonProps) {

  const handleExportPDF = async () => {
    const element = document.getElementById(targetElementId)
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff" // Ensure white background
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save(`${campaignName}-report.pdf`)
    } catch (error) {
      console.error("PDF Export Failed:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const handleExportCSV = () => {
    if (!responses || responses.length === 0) {
      alert("No data to export")
      return
    }

    // 1. Extract all unique question keys (headers)
    const questionKeys = new Set<string>()
    responses.forEach(r => {
      if (r.rawAnswers) {
        Object.keys(r.rawAnswers).forEach(k => questionKeys.add(k))
      }
    })
    const headers = ["Submitted At", ...Array.from(questionKeys)]

    // 2. Build rows
    const rows = responses.map(r => {
      const rowData = [
        new Date(r.submittedAt).toLocaleString(),
        ...Array.from(questionKeys).map(key => {
          const answer = r.rawAnswers[key]
          // Handle arrays (multiple choice) or objects if necessary, though usually strings/numbers
          if (Array.isArray(answer)) return `"${answer.join(", ")}"`
          if (typeof answer === "object") return `"${JSON.stringify(answer)}"`
          return `"${String(answer || "").replace(/"/g, '""')}"` // Escape quotes
        })
      ]
      return rowData.join(",")
    })

    // 3. Combine and download
    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `${campaignName}-responses.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Export Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <Table className="w-4 h-4 mr-2" />
          Export Data (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

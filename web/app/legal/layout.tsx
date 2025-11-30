import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-violet-500/30 selection:text-violet-200 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24 max-w-4xl">
        <div className="prose dark:prose-invert max-w-none">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

import { Navbar } from "@/components/layout/Navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p>Welcome to your workspace!</p>
      </div>
    </div>
  )
}

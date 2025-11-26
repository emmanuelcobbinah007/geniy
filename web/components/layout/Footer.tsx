import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 pt-16 pb-8 transition-colors duration-300">
      <div className="container max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-foreground">Geniy</span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed">
              The AI-powered market research platform that turns context into actionable insights in minutes.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Features</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Integrations</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Pricing</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">About</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Blog</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Careers</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Privacy</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Terms</Link></li>
              <li><Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-zinc-200 dark:border-zinc-900 pt-8 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} Geniy Inc. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

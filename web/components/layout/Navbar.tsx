"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Menu, X, User, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      const lenis = (window as any).lenis
      if (lenis) {
        lenis.scrollTo(element)
      } else {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <nav className="w-full max-w-6xl rounded-full py-3 border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-sm shadow-sm transition-all duration-300">
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-[50px] h-[50px]">
                <Image 
                  src="/geniy_logo_light.png" 
                  alt="Geniy Logo" 
                  fill
                  className="object-contain dark:hidden" 
                />
                <Image 
                  src="/geniy_logo_dark.png" 
                  alt="Geniy Logo" 
                  fill
                  className="object-contain hidden dark:block" 
                />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Geniy</span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => scrollToSection('comparison')} className="text-sm font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors cursor-pointer">
                Why Geniy
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors cursor-pointer">
                Pricing
              </button>
              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800">
                        <AvatarImage src="" alt={user.name || "User"} />
                        <AvatarFallback className="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="ghost" className="text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 hover:bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 h-9 text-sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-600 dark:text-zinc-300">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-white dark:bg-zinc-950 md:hidden"
            style={{ zIndex: 100 }}
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                    <Zap className="h-5 w-5 fill-current" />
                  </div>
                  <span className="text-xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Geniy</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-600 dark:text-zinc-300">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex flex-col gap-6 text-center mt-8">
                <button onClick={() => scrollToSection('features')} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                  Features
                </button>
                <button onClick={() => scrollToSection('comparison')} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                  Why Geniy
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                  Pricing
                </button>
                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-900 my-2" />
                
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                      Settings
                    </Link>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-lg font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400 transition-colors">
                      Login
                    </Link>
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 text-base">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

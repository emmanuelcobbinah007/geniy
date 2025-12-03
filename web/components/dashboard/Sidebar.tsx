"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { CreateWorkspaceDialog } from "@/components/workspaces/CreateWorkspaceDialog"

import { useParams, useRouter } from "next/navigation"

export function Sidebar() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const workspaceId = params?.workspaceId as string
  
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
  const { user, logout } = useAuth()

  const links = [
    { href: `/dashboard/${workspaceId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/dashboard/${workspaceId}/campaigns`, label: "Campaigns", icon: FolderOpen },
    { href: `/dashboard/${workspaceId}/context`, label: "Context", icon: FileText },
    { href: `/dashboard/${workspaceId}/settings`, label: "Settings", icon: Settings },
  ]

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" onClick={() => isMobile && setMobileOpen(false)}>
          <div className={cn("flex items-center gap-2 transition-all", collapsed && !isMobile ? "justify-center w-full" : "justify-start")}>
          <div className="relative w-[60px] h-[60px] shrink-0">
             <Image 
               src="/gen_logo.png" 
               alt="Geniy" 
               fill
               className="object-contain dark:hidden"
             />
             <Image 
               src="/gen_logo.png" 
               alt="Geniy" 
               fill
               className="object-contain hidden dark:block"
             />
          </div>
          {(!collapsed || isMobile) && (
            <span className="font-bold text-xl tracking-tight text-foreground ml-[-15px]">
              Geniy
            </span>
          )}
        </div>
        </Link>
        {!isMobile && (
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setCollapsed(!collapsed)}
            >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
        )}
        {isMobile && (
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setMobileOpen(false)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-2 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                collapsed && !isMobile && "px-2 justify-center"
              )}
            >
              <div className="h-5 w-5 rounded bg-violet-500 flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">
                {user?.workspaces?.find((w: any) => w.id === workspaceId)?.name || 
                 user?.sharedWorkspaces?.find((w: any) => w.id === workspaceId)?.name || 
                 "Select Workspace"}
              </span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" align="start">
            <DropdownMenuLabel className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">My Workspaces</DropdownMenuLabel>
            {user?.workspaces?.map((ws: any) => (
                <DropdownMenuItem key={ws.id} className="cursor-pointer" onSelect={() => router.push(`/dashboard/${ws.id}`)}>
                    <div className="h-2 w-2 rounded-full bg-violet-500 mr-2" />
                    {ws.name}
                </DropdownMenuItem>
            ))}
            {!user?.workspaces?.length && <DropdownMenuItem disabled>No workspaces found</DropdownMenuItem>}
            
            {user?.sharedWorkspaces && user.sharedWorkspaces.length > 0 && (
                <>
                    <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
                    <DropdownMenuLabel className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Shared Workspaces</DropdownMenuLabel>
                    {user.sharedWorkspaces.map((ws: any) => (
                        <DropdownMenuItem key={ws.id} className="cursor-pointer" onSelect={() => router.push(`/dashboard/${ws.id}`)}>
                            <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2" />
                            {ws.name}
                        </DropdownMenuItem>
                    ))}
                </>
            )}

            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
            <DropdownMenuItem className="cursor-pointer text-violet-600 dark:text-violet-400" onSelect={() => setCreateWorkspaceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100",
                collapsed && !isMobile && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Profile / Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 h-auto py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900",
                collapsed && !isMobile && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              {(!collapsed || isMobile) && (
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-medium truncate w-full">{user?.name || "User"}</span>
                  <span className="text-xs text-zinc-500 truncate w-full">{user?.email}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )

  return (
    <>
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
                <div className="relative w-[60px] h-[60px] shrink-0">
                    <Image src="/gen_logo.png" alt="Geniy" fill className="object-contain dark:hidden" />
                    <Image src="/gen_logo.png" alt="Geniy" fill className="object-contain hidden dark:block" />
                </div>
                <span className="font-bold text-xl tracking-tight text-foreground ml-[-15px]">Geniy</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                <LayoutDashboard className="h-6 w-6" />
            </Button>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-50 md:hidden"
                onClick={() => setMobileOpen(false)}
            />
        )}

        {/* Mobile Drawer */}
        <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: mobileOpen ? 0 : "-100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 md:hidden flex flex-col"
        >
            <SidebarContent isMobile={true} />
        </motion.aside>

        {/* Desktop Sidebar */}
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hidden md:flex flex-col transition-all duration-300 z-50",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <SidebarContent />
        </motion.aside>
    </>
  )
}

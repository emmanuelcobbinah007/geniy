"use client"

import { createContext, useContext, useEffect } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"

interface User {
  id: string
  name: string | null
  email: string
  workspaces?: any[]
  sharedWorkspaces?: any[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  googleLogin: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch user query
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = localStorage.getItem("token")
      if (!token) return null
      try {
        return await api.get("/auth/me", token)
      } catch (error) {
        localStorage.removeItem("token")
        return null
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Helper to get token (for consistency with old API, though we rely on localStorage in queryFn)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/signin", { email, password })
    localStorage.setItem("token", data.token)
    await queryClient.invalidateQueries({ queryKey: ["user"] })
  }

  const signup = async (name: string, email: string, password: string) => {
    const data = await api.post("/auth/signup", { name, email, password })
    localStorage.setItem("token", data.token)
    await queryClient.invalidateQueries({ queryKey: ["user"] })
  }

  const googleLogin = async (token: string) => {
    const data = await api.post("/auth/google", { token })
    localStorage.setItem("token", data.token)
    await queryClient.invalidateQueries({ queryKey: ["user"] })
  }

  const logout = () => {
    localStorage.removeItem("token")
    queryClient.setQueryData(["user"], null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

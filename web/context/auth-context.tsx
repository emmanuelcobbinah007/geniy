"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string | null
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  googleLogin: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      fetchUser(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const userData = await api.get("/auth/me", authToken)
      setUser(userData)
    } catch (error) {
      console.error("Failed to fetch user", error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/signin", { email, password })
    localStorage.setItem("token", data.token)
    setToken(data.token)
    setUser(data) // The backend returns user data along with token usually, or we fetch it
    // If backend only returns token, we should fetch user immediately:
    // await fetchUser(data.token)
    // Assuming backend returns { token, id, name, email } based on typical controller logic
    // Let's verify controller logic later, but for now assuming standard response.
    // Actually, looking at authController.js (implied), it likely returns token + user info.
    // If not, we can do a follow-up fetch.
    // For now, let's assume we need to fetch user profile if it's not full.
    // But to be safe, let's just fetch /me after login to ensure we have the full object.
    await fetchUser(data.token)
  }

  const signup = async (email: string, password: string) => {
    const data = await api.post("/auth/signup", { email, password })
    localStorage.setItem("token", data.token)
    setToken(data.token)
    await fetchUser(data.token)
  }

  const googleLogin = async (token: string) => {
    const data = await api.post("/auth/google", { token })
    localStorage.setItem("token", data.token)
    setToken(data.token)
    await fetchUser(data.token)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, googleLogin, logout }}>
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

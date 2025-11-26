"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Mail, Lock, ArrowRight, Github, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFormik } from "formik"
import * as Yup from "yup"

import { useAuth } from "@/context/auth-context"
import { useGoogleLogin } from "@react-oauth/google"

export function AuthForm({ isModal = false, onSuccess }: { isModal?: boolean; onSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { login, signup, googleLogin } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
  })

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      setError(null)
      try {
        if (isLogin) {
          await login(values.email, values.password)
        } else {
          await signup(values.email, values.password)
        }
        if (onSuccess) onSuccess()
      } catch (err: any) {
        setError(err.message || "Authentication failed")
      } finally {
        setIsLoading(false)
      }
    },
  })

  const toggleMode = () => {
    setIsLogin(!isLogin)
    formik.resetForm()
    setError(null)
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError(null)
      try {
        await googleLogin(tokenResponse.access_token)
        if (onSuccess) onSuccess()
      } catch (err: any) {
        setError(err.message || "Google authentication failed")
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      setError("Google authentication failed")
      setIsLoading(false)
    }
  })

  return (
    <Card className={`w-full max-w-md border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl ${isModal ? 'border-none shadow-none bg-transparent' : ''}`}>
      <CardHeader className="space-y-1 text-center">
        {!isModal && (
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
              <Zap className="h-6 w-6 fill-current" />
            </div>
          </div>
        )}
        <CardTitle className="text-2xl font-bold font-display tracking-tight text-foreground">
          {isLogin ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          {isLogin ? "Enter your credentials to access your workspace." : "Start your 14-day free trial. No credit card required."}
        </CardDescription>
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input 
                id="email"
                placeholder="name@example.com" 
                className={`pl-10 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500 ${formik.touched.email && formik.errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                type="email"
                {...formik.getFieldProps("email")}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-500 pl-1">{formik.errors.email}</p>
            )}
            
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input 
                id="password"
                placeholder="••••••••" 
                className={`pl-10 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500 ${formik.touched.password && formik.errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                type="password"
                {...formik.getFieldProps("password")}
              />
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-red-500 pl-1">{formik.errors.password}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button 
            variant="outline" 
            className="w-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-100"
            onClick={() => handleGoogleLogin()}
            type="button"
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Continue with Google
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center text-sm">
        <div className="text-zinc-500 dark:text-zinc-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={toggleMode}
            className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 underline-offset-4 hover:underline transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
        {isLogin && (
          <Link href="#" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
            Forgot your password?
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}

"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { motion } from "framer-motion"
import Link from "next/link"

export default function AuthPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-700">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <AuthForm />

        <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  )
}

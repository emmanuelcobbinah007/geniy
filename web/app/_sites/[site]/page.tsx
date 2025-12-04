import { api } from "@/lib/api"
import { SurveyPageClient } from "../../s/[slug]/SurveyPageClient"
import { notFound } from "next/navigation"

export default async function CustomDomainPage({ params }: { params: { site: string } }) {
  const domain = decodeURIComponent(params.site)
  
  // TODO: Lookup domain in database to get the associated survey slug
  // const surveySlug = await api.getSlugFromDomain(domain)
  
  // For POC: We will just show a placeholder or try to load a specific survey if mapped
  // For now, let's just render a success message proving the custom domain works
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        
        <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Custom Domain Active!</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
                You are viewing this page via:
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 py-2 px-4 rounded-lg font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200 inline-block">
                {domain}
            </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            This proves that the Geniy middleware is correctly rewriting requests from your custom domain to our multi-tenant router.
        </p>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-400">Geniy Enterprise Feature</p>
        </div>
      </div>
    </div>
  )
}

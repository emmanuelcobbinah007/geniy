"use client"

import Link from "next/link"
import Image from "next/image"
import { Twitter, Linkedin, Github } from "lucide-react"

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "mailto:hello@geniy.io" },
  ],
  legal: [
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Security", href: "/legal/security" },
  ],
}

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/geniyai", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/geniy", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/geniy", label: "GitHub" },
]

export function Footer() {
  return (
    <footer className="relative bg-zinc-950 text-white overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>
      <div className="container max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-6">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image 
                    src="/gen_logo.png" 
                    alt="Geniy" 
                    fill
                    className="object-contain" 
                  />
                </div>
                <span className="text-xl font-bold font-display tracking-tight">Geniy</span>
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                The decision engine for early-stage founders. Turn uncertainty into clarity, automatically.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-4 pt-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Link 
                      key={social.label}
                      href={social.href}
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-violet-500/20 hover:border-violet-500/30 transition-all duration-300"
                      aria-label={social.label}
                    >
                      <Icon className="w-4 h-4 text-zinc-400" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h3>
                  <ul className="space-y-3">
                    {footerLinks.product.map((link) => (
                      <li key={link.label}>
                        <Link 
                          href={link.href}
                          className="text-sm text-zinc-400 hover:text-violet-400 transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h3>
                  <ul className="space-y-3">
                    {footerLinks.company.map((link) => (
                      <li key={link.label}>
                        <Link 
                          href={link.href}
                          className="text-sm text-zinc-400 hover:text-violet-400 transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Legal</h3>
                  <ul className="space-y-3">
                    {footerLinks.legal.map((link) => (
                      <li key={link.label}>
                        <Link 
                          href={link.href}
                          className="text-sm text-zinc-400 hover:text-violet-400 transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Geniy Inc. All rights reserved.
            </p>
            
            {/* Aurora Labs Badge */}
            <Link 
            target="_blank"
              href="https://aurorasoftwarelabs.io/" 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="relative w-5 h-5">
                <Image 
                  src="/AuroraLogoDark.png" 
                  alt="Aurora Software Labs" 
                  fill
                  className="object-contain" 
                />
              </div>
              <span className="text-xs text-zinc-400">Built by Aurora Software Labs</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

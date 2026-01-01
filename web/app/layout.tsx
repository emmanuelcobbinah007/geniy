import type { Metadata } from "next";
import { Outfit, Poppins, Playfair_Display, Caveat, Indie_Flower, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import "./driver-theme.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { AuthProvider } from "@/context/auth-context"
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const poppins = Poppins({ 
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// 1. Elegant/Editorial (Market Research)
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

// 2. Handwriting/Creative (Idea Validation)
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

// 3. Artistic/Casual (Customer Feedback)
const indie = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-indie",
});

// 4. Melodrama Lookalike
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

const siteUrl = "https://geniy.aurorasoftwarelabs.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Geniy | AI-Powered Market Research & Competitor Intelligence",
    template: "%s | Geniy"
  },
  description: "Turn business context into intelligent surveys in seconds. Geniy uses AI to automate market research, track competitors, and deliver actionable insights.",
  keywords: [
    "AI market research",
    "AI survey builder",
    "competitor analysis tool",
    "competitive intelligence",
    "market research automation",
    "AI surveys",
    "automated customer research",
    "startup market research",
    "SaaS competitor tracking"
  ],
  authors: [{ name: "Aurora Software Labs", url: "https://aurorasoftwarelabs.io" }],
  creator: "Aurora Software Labs",
  publisher: "Aurora Software Labs",
  
  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Geniy",
    title: "Geniy | AI-Powered Market Research & Competitor Intelligence",
    description: "Turn business context into intelligent surveys in seconds. Automate market research and track competitors with AI.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Geniy - AI Market Research Platform",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Geniy | AI-Powered Market Research",
    description: "Turn business context into intelligent surveys in seconds. Automate market research with AI.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@geniyai",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Verification (add your codes here)
  verification: {
    // google: "your-google-verification-code",
  },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  
  // Manifest
  manifest: "/site.webmanifest",
  
  // Canonical
  alternates: {
    canonical: siteUrl,
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Geniy",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
      sameAs: [
        "https://twitter.com/geniyai",
        "https://linkedin.com/company/geniy",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Geniy",
      publisher: { "@id": `${siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Geniy",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "29",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "150",
      },
      description: "AI-powered market research and competitor intelligence platform",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={cn(
        outfit.variable, 
        poppins.variable, 
        playfair.variable,
        caveat.variable,
        indie.variable,
        dmSerif.variable,
        poppins.className, 
        "font-sans antialiased bg-background text-foreground"
      )} suppressHydrationWarning>
        <Providers>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                storageKey="geniy-theme-preference"
              >
                <SmoothScroll>
                  {children}
                  <Toaster />
                </SmoothScroll>
              </ThemeProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </Providers>
      </body>
    </html>
  );
}

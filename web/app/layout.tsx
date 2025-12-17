import type { Metadata } from "next";
import { Outfit, Poppins, Playfair_Display, Caveat, Indie_Flower, DM_Serif_Display } from "next/font/google"; // Mixed bag of fonts
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

export const metadata: Metadata = {
  title: "Geniy | AI Market Research",
  description: "Turn context into intelligent surveys in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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

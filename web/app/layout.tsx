import type { Metadata } from "next";
import { Outfit, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { AuthProvider } from "@/context/auth-context"
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Providers } from "@/components/providers";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const poppins = Poppins({ 
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
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
      <body className={cn(outfit.variable, poppins.variable, "font-sans antialiased bg-background text-foreground")}>
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
                </SmoothScroll>
              </ThemeProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </Providers>
      </body>
    </html>
  );
}

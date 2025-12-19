import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Comparison } from "@/components/landing/Comparison";

import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/layout/Footer";
import { Waitlist } from "@/components/landing/Waitlist";
import { DemoVideo } from "@/components/landing/DemoVideo";
import { MeshBackground } from "@/components/ui/mesh-background";

export default function Home() {
  return (
    <main className="min-h-screen dark:bg-zinc-950 selection:bg-violet-500/30 selection:text-violet-200 relative">
      <MeshBackground />
      <Navbar />
      <Hero />
      <DemoVideo />
      <Features />
      <Comparison />
      <Pricing />
      <Waitlist />
      <Footer />
    </main>
  );
}

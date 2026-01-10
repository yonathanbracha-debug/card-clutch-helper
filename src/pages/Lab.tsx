import { Suspense, lazy } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AmbientBackground } from "@/components/marketing/AmbientBackground";

// Lazy load the heavy 3D component
const NeuralNetworkHero = lazy(() =>
  import("@/components/ui/neural-network-hero").then((mod) => ({
    default: mod.NeuralNetworkHero,
  }))
);

function LoadingFallback() {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-sm text-muted-foreground">Loading 3D experience...</p>
      </div>
    </div>
  );
}

export default function Lab() {
  return (
    <div className="min-h-screen bg-background">
      <AmbientBackground />
      <Header />

      <main className="pt-14 relative z-10">
        <Suspense fallback={<LoadingFallback />}>
          <NeuralNetworkHero />
        </Suspense>

        <section className="border-t border-border">
          <div className="max-w-2xl mx-auto px-6 py-16 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              About this experiment
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This is an experimental visualization of neural network-style decision making.
              The actual CardClutch engine uses deterministic rule-based logic, not neural networks,
              to ensure explainable and predictable recommendations.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

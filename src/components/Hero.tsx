import { UrlInput } from './UrlInput';
import { Recommendation } from '@/lib/recommendationEngine';
import { RecommendationResult } from './RecommendationResult';
import { CreditCard, ArrowDown } from 'lucide-react';

interface HeroProps {
  onUrlSubmit: (url: string) => void;
  recommendation: Recommendation | null;
  hasSelectedCards: boolean;
}

export function Hero({ onUrlSubmit, recommendation, hasSelectedCards }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 hero-glow opacity-50 pointer-events-none" />
      
      {/* Floating card decoration */}
      <div className="absolute top-20 right-10 opacity-10 animate-float hidden lg:block">
        <CreditCard className="w-32 h-32 text-primary" />
      </div>
      <div className="absolute bottom-40 left-10 opacity-10 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
        <CreditCard className="w-24 h-24 text-primary rotate-12" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Smart credit card recommendations
          </span>
        </div>

        {/* Main headline */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
          Use the right card.{' '}
          <span className="gradient-text">Every time.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Paste any shopping URL. CardClutch tells you which credit card maximizes your rewards—instantly.
        </p>

        {/* URL Input or Warning */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {!hasSelectedCards ? (
            <div className="glass-card rounded-xl p-6 max-w-md mx-auto">
              <p className="text-muted-foreground mb-4">
                First, select your credit cards below
              </p>
              <a 
                href="#cards"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ArrowDown className="w-4 h-4" />
                Choose your cards
              </a>
            </div>
          ) : (
            <UrlInput onSubmit={onUrlSubmit} isDisabled={!hasSelectedCards} />
          )}
        </div>

        {/* Recommendation Result */}
        {recommendation && (
          <div className="mt-12">
            <RecommendationResult recommendation={recommendation} />
          </div>
        )}
      </div>
    </section>
  );
}

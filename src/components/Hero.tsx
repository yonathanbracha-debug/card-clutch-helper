import { UrlInput } from './UrlInput';
import { Recommendation } from '@/lib/recommendationEngine';
import { RecommendationResult } from './RecommendationResult';
import { RecentSearches } from './RecentSearches';
import { RecentSearch } from '@/hooks/useRecentSearches';
import { CardSelector } from './CardSelector';

interface HeroProps {
  onUrlSubmit: (url: string) => void;
  recommendation: Recommendation | null;
  hasSelectedCards: boolean;
  lastUrl?: string;
  recentSearches: RecentSearch[];
  onClearSearches: () => void;
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
}

export function Hero({ 
  onUrlSubmit, 
  recommendation, 
  hasSelectedCards, 
  lastUrl,
  recentSearches,
  onClearSearches,
  selectedCards,
  onToggleCard,
}: HeroProps) {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container max-w-2xl mx-auto">
        {/* Headline - sharp, preventative language */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-balance animate-fade-in">
            Make the right credit move before you swipe.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto animate-fade-in">
            CardClutch helps you choose the best card at the moment of purchase—so you protect your credit and maximize rewards in real time.
          </p>
        </div>

        {/* Value bullets - sharp, professional */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 text-sm text-muted-foreground">
          <span>Category exclusions</span>
          <span className="hidden md:inline">·</span>
          <span>Reward optimization</span>
          <span className="hidden md:inline">·</span>
          <span>Real-time guidance</span>
        </div>

        {/* Decision Engine */}
        <div className="surface-elevated rounded-lg p-6 md:p-8 animate-slide-up">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Decision Engine
          </div>
          
          {/* Card Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Your cards
            </label>
            <CardSelector 
              selectedCards={selectedCards} 
              onToggleCard={onToggleCard} 
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Checkout URL
            </label>
            {!hasSelectedCards ? (
              <div className="px-4 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Select at least one card above to get started
              </div>
            ) : (
              <UrlInput onSubmit={onUrlSubmit} isDisabled={!hasSelectedCards} defaultUrl={lastUrl} />
            )}
          </div>

          {/* Recommendation Result */}
          {recommendation && (
            <div className="mt-6 pt-6 border-t border-border">
              <RecommendationResult recommendation={recommendation} />
            </div>
          )}
        </div>

        {/* Recent Searches */}
        {!recommendation && hasSelectedCards && recentSearches.length > 0 && (
          <div className="mt-6">
            <RecentSearches 
              searches={recentSearches} 
              onSelect={onUrlSubmit}
              onClear={onClearSearches}
            />
          </div>
        )}

        {/* Privacy statement */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No accounts. No tracking. All logic runs locally in your browser.
          </p>
        </div>
      </div>
    </section>
  );
}
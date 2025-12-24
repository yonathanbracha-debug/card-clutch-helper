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
        {/* Headline */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 text-balance tracking-tight">
            The decision happens before the swipe.
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Know which card to use. Understand exclusions. Maximize every purchase.
          </p>
        </div>

        {/* Decision Engine */}
        <div className="surface-elevated rounded-lg p-6 md:p-8">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
            Card Decision Engine
          </div>
          
          {/* Card Selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              Your wallet
            </label>
            <CardSelector 
              selectedCards={selectedCards} 
              onToggleCard={onToggleCard} 
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Where are you shopping?
            </label>
            {!hasSelectedCards ? (
              <div className="px-4 py-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Select at least one card to get started
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

        {/* Trust statement */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground">
            No accounts. No tracking. All logic runs locally.
          </p>
        </div>
      </div>
    </section>
  );
}

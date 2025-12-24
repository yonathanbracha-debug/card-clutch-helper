import { Clock, X, ArrowRight } from 'lucide-react';
import { RecentSearch } from '@/hooks/useRecentSearches';

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (url: string) => void;
  onClear: () => void;
}

export function RecentSearches({ searches, onSelect, onClear }: RecentSearchesProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Recent searches</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {searches.map((search) => (
          <button
            key={search.id}
            onClick={() => onSelect(search.url)}
            className="w-full glass-card rounded-xl p-4 text-left hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">
                    {search.merchantName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0">
                    {search.categoryLabel}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Use <span className="text-primary font-medium">{search.cardIssuer} {search.cardName}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

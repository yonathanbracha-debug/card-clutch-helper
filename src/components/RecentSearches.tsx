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
    <div className="surface-primary rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Recent</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-1">
        {searches.map((search) => (
          <button
            key={search.id}
            onClick={() => onSelect(search.url)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {search.merchantName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {search.categoryLabel}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {search.cardIssuer} {search.cardName}
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
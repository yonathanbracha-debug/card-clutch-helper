import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isDisabled: boolean;
  defaultUrl?: string;
}

export function UrlInput({ onSubmit, isDisabled, defaultUrl }: UrlInputProps) {
  const [url, setUrl] = useState(defaultUrl || '');

  useEffect(() => {
    if (defaultUrl && !url) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const placeholderExamples = [
    'amazon.com',
    'doordash.com',
    'costco.com',
    'nike.com',
  ];

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="mb-2">
        <label className="block text-sm font-medium text-foreground mb-1">
          Paste a checkout or product page URL
        </label>
        <p className="text-xs text-muted-foreground">
          CardClutch automatically detects the merchant and purchase category.
        </p>
      </div>
      
      <div className="relative mt-3">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="w-5 h-5" />
        </div>
        
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g., amazon.com/cart or target.com/checkout"
          className="w-full h-14 pl-12 pr-40 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          disabled={isDisabled}
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button 
            type="submit" 
            variant="hero"
            size="default"
            disabled={isDisabled || !url.trim()}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Get Recommendation
          </Button>
        </div>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span className="text-xs text-muted-foreground">Try:</span>
        {placeholderExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setUrl(example)}
            className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}

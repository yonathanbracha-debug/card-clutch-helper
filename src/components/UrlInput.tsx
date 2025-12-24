import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isDisabled: boolean;
  defaultUrl?: string;
}

export function UrlInput({ onSubmit, isDisabled, defaultUrl }: UrlInputProps) {
  const [url, setUrl] = useState(defaultUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultUrl && !url) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isDisabled) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onSubmit(url.trim());
    setIsLoading(false);
  };

  const examples = ['amazon.com', 'doordash.com', 'costco.com', 'nike.com'];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste any checkout URL..."
            disabled={isDisabled}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg border bg-background text-sm transition-colors",
              "border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              "placeholder:text-muted-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            type="submit"
            disabled={!url.trim() || isDisabled || isLoading}
            className={cn(
              "px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap",
              "bg-primary text-primary-foreground hover:opacity-90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Analyze
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Quick examples */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-muted-foreground">Try:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setUrl(example)}
            className="text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
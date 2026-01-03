import { CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VaultEmptyStateProps {
  onOpenVault: () => void;
  onLoadDemo: () => void;
}

export function VaultEmptyState({ onOpenVault, onLoadDemo }: VaultEmptyStateProps) {
  return (
    <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <CreditCard className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">No cards in your vault yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        Add your cards once. We'll recommend the best one at checkout.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onOpenVault}>
          Choose your cards
        </Button>
        <Button variant="outline" onClick={onLoadDemo} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Try demo vault
        </Button>
      </div>
    </div>
  );
}

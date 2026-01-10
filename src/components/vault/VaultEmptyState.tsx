import { CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VaultEmptyStateProps {
  onOpenVault: () => void;
  onLoadDemo: () => void;
}

export function VaultEmptyState({ onOpenVault, onLoadDemo }: VaultEmptyStateProps) {
  return (
    <div className="p-5 rounded border border-dashed border-border bg-secondary/50 text-center">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-sm text-foreground mb-1">No cards selected</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your cards to get personalized recommendations.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onOpenVault} size="sm">
          Add cards
        </Button>
        <Button variant="outline" onClick={onLoadDemo} size="sm" className="gap-2">
          <Sparkles className="w-3 h-3" />
          Use demo cards
        </Button>
      </div>
    </div>
  );
}

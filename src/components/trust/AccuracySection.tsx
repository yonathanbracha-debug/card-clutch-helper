import { CheckCircle, Eye, Users } from 'lucide-react';
import { DataStatusModal } from './DataStatusModal';

export function AccuracySection() {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/30">
      <h4 className="text-sm font-medium mb-3">How we stay accurate</h4>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Rules first (deterministic)</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Transparent exclusions</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Community-reported corrections</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <DataStatusModal />
      </div>
    </div>
  );
}

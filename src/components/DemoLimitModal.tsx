import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, Lock, Gift } from 'lucide-react';

interface DemoLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueDemo?: () => void;
  showBonusOption?: boolean;
}

export function DemoLimitModal({ 
  open, 
  onOpenChange, 
  onContinueDemo,
  showBonusOption = true 
}: DemoLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Save your card vault + get updates</DialogTitle>
          <DialogDescription className="text-base">
            Create a free account to keep your cards, unlock unlimited analyses, and get verified recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CreditCard className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Save your card wallet</p>
              <p className="text-xs text-muted-foreground">Access your cards from any device</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Unlimited recommendations</p>
              <p className="text-xs text-muted-foreground">Analyze as many merchants as you want</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link to="/auth" className="w-full">
            <Button className="w-full gap-2" size="lg">
              Create account
              <Sparkles className="w-4 h-4" />
            </Button>
          </Link>
          {showBonusOption && onContinueDemo && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onContinueDemo();
                onOpenChange(false);
              }}
              className="gap-2"
            >
              <Gift className="w-4 h-4" />
              Continue in demo (1 more)
            </Button>
          )}
          {!showBonusOption && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Not now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

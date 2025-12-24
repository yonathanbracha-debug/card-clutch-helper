import { CheckCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  status: 'verified' | 'needs_review' | 'pending' | 'unverified';
  lastVerified?: Date | string;
  sourceUrl?: string;
  className?: string;
}

export function VerificationBadge({ 
  status, 
  lastVerified, 
  sourceUrl,
  className 
}: VerificationBadgeProps) {
  const config = {
    verified: {
      icon: CheckCircle,
      label: 'Verified',
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    needs_review: {
      icon: AlertCircle,
      label: 'Needs Review',
      color: 'text-amber-500 bg-amber-500/10',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      color: 'text-blue-500 bg-blue-500/10',
    },
    unverified: {
      icon: AlertCircle,
      label: 'Unverified',
      color: 'text-muted-foreground bg-muted',
    },
  };

  const { icon: Icon, label, color } = config[status];
  
  const formattedDate = lastVerified 
    ? new Date(lastVerified).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-help",
          color,
          className
        )}>
          <Icon className="w-3 h-3" />
          <span>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium">{label}</p>
          {formattedDate && (
            <p className="text-xs text-muted-foreground">
              Last verified: {formattedDate}
            </p>
          )}
          {sourceUrl && (
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View source <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {status === 'unverified' && (
            <p className="text-xs text-muted-foreground">
              This data has not been verified against official sources.
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
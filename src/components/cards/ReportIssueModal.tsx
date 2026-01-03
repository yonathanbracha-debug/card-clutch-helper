import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

const REPORTS_STORAGE_KEY = 'cc_card_reports_v1';

interface CardReport {
  id: string;
  cardId: string;
  cardName: string;
  message: string;
  timestamp: string;
}

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  cardName: string;
}

export function ReportIssueModal({ open, onOpenChange, cardId, cardName }: ReportIssueModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get existing reports
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
      const reports: CardReport[] = stored ? JSON.parse(stored) : [];

      // Add new report
      const newReport: CardReport = {
        id: crypto.randomUUID(),
        cardId,
        cardName,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      reports.push(newReport);
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));

      toast.success("Saved. We'll review this.");
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <DialogTitle>Report Incorrect Info</DialogTitle>
          </div>
          <DialogDescription>
            Help us keep <span className="font-medium">{cardName}</span> data accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="issue">What's incorrect?</Label>
            <Textarea
              id="issue"
              placeholder="e.g., The annual fee is wrong, it should be $250 not $325..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Reports are stored locally and help us prioritize data verification.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility to get all reports (for admin/debugging)
export function getStoredReports(): CardReport[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

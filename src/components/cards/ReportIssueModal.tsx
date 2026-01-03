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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    // Always save to localStorage as backup
    try {
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
      const reports: CardReport[] = stored ? JSON.parse(stored) : [];
      const newReport: CardReport = {
        id: crypto.randomUUID(),
        cardId,
        cardName,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      reports.push(newReport);
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch (err) {
      console.error('LocalStorage backup failed:', err);
    }

    // Try to send to Supabase
    try {
      const { error } = await supabase.from('data_issue_reports').insert({
        card_id: cardId,
        user_id: user?.id || null,
        issue_type: 'incorrect_info',
        description: message.trim(),
        status: 'open',
      });

      if (error) {
        console.error('Supabase insert failed:', error);
        toast.success("Saved locally. We'll review this.");
      } else {
        toast.success("Sent to review. Thank you!");
      }
    } catch (err) {
      console.error('Supabase error:', err);
      toast.success("Saved locally (offline). We'll review this.");
    }

    setMessage('');
    onOpenChange(false);
    setIsSubmitting(false);
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

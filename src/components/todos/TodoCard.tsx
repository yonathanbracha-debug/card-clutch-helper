import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  CreditCard,
  Bell,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Gift,
  ArrowRight,
} from 'lucide-react';
import type { Todo, TodoType } from '@/hooks/useTodos';
import { cn } from '@/lib/utils';

interface TodoCardProps {
  todo: Todo;
  onMarkDone: (id: string) => Promise<void>;
  onSnooze: (id: string, days: number) => Promise<void>;
}

const TYPE_ICONS: Record<TodoType, React.ReactNode> = {
  cancel_subscription: <RefreshCw className="w-4 h-4" />,
  review_subscription: <RefreshCw className="w-4 h-4" />,
  claim_benefit: <Gift className="w-4 h-4" />,
  switch_card_rule: <CreditCard className="w-4 h-4" />,
  contact_issuer: <Bell className="w-4 h-4" />,
  set_autopay: <FileCheck className="w-4 h-4" />,
  verify_statement: <AlertCircle className="w-4 h-4" />,
};

const TYPE_COLORS: Record<TodoType, string> = {
  cancel_subscription: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  review_subscription: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  claim_benefit: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  switch_card_rule: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  contact_issuer: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  set_autopay: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
  verify_statement: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
};

export function TodoCard({ todo, onMarkDone, onSnooze }: TodoCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkDone = async () => {
    setIsLoading(true);
    try {
      await onMarkDone(todo.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnooze = async (days: number) => {
    setIsLoading(true);
    try {
      await onSnooze(todo.id, days);
    } finally {
      setIsLoading(false);
    }
  };

  const isDone = todo.status === 'done';

  return (
    <Card className={cn(
      "transition-all duration-200",
      isDone && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            TYPE_COLORS[todo.type]
          )}>
            {TYPE_ICONS[todo.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn(
                  "font-medium text-sm",
                  isDone && "line-through text-muted-foreground"
                )}>
                  {todo.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {todo.description}
                </p>
              </div>

              {/* Impact Badge */}
              {todo.impact_usd > 0 && (
                <Badge 
                  variant="secondary" 
                  className="shrink-0 bg-primary/10 text-primary border-0"
                >
                  ${todo.impact_usd.toFixed(0)}/mo
                </Badge>
              )}
            </div>

            {/* Actions */}
            {!isDone && (
              <div className="flex items-center gap-2 mt-3">
                {todo.cta_label && todo.cta_url && (
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1" asChild>
                    <a href={todo.cta_url} target="_blank" rel="noopener noreferrer">
                      {todo.cta_label}
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs gap-1"
                  onClick={handleMarkDone}
                  disabled={isLoading}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Done
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0"
                      disabled={isLoading}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSnooze(7)}>
                      <Clock className="w-4 h-4 mr-2" />
                      Snooze 7 days
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSnooze(30)}>
                      <Clock className="w-4 h-4 mr-2" />
                      Snooze 30 days
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

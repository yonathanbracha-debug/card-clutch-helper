import { useTodos } from '@/hooks/useTodos';
import { TodoCard } from './TodoCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoListProps {
  compact?: boolean;
  maxItems?: number;
}

export function TodoList({ compact = false, maxItems }: TodoListProps) {
  const { openTodos, doneTodos, totalImpact, loading, updateTodoStatus, snoozeTodo } = useTodos();

  const handleMarkDone = async (id: string) => {
    await updateTodoStatus(id, 'done');
  };

  const handleSnooze = async (id: string, days: number) => {
    await snoozeTodo(id, days);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const displayTodos = maxItems ? openTodos.slice(0, maxItems) : openTodos;
  const hiddenCount = maxItems ? Math.max(0, openTodos.length - maxItems) : 0;

  return (
    <Card>
      <CardHeader className={cn("flex flex-row items-center justify-between", compact ? "pb-2" : "pb-4")}>
        <CardTitle className={cn("flex items-center gap-2", compact ? "text-lg" : "text-xl")}>
          <ClipboardList className="w-5 h-5 text-primary" />
          To-dos
        </CardTitle>
        <div className="flex items-center gap-2">
          {totalImpact > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              ${totalImpact.toFixed(0)}/mo potential
            </Badge>
          )}
          <Badge variant="outline">{openTodos.length} open</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayTodos.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              All caught up! No action items right now.
            </p>
          </div>
        ) : (
          <>
            {displayTodos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onMarkDone={handleMarkDone}
                onSnooze={handleSnooze}
              />
            ))}
            {hiddenCount > 0 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                +{hiddenCount} more items
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

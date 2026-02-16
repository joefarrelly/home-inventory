import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Chore, ChoreCompletion, getDaysSinceLastDone, isOverdue, isDueSoon } from '@/types/chore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoreInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chore: Chore | null;
  completions: ChoreCompletion[];
  onDeleteCompletion: (id: string) => void;
}

export function ChoreInfoDialog({
  open,
  onOpenChange,
  chore,
  completions,
  onDeleteCompletion,
}: ChoreInfoDialogProps) {
  if (!chore) return null;

  const choreCompletions = completions
    .filter(c => c.choreId === chore.id)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const daysSince = getDaysSinceLastDone(chore.id, completions);
  const overdue = isOverdue(chore, completions);
  const dueSoon = isDueSoon(chore, completions);
  const hasSchedule = chore.frequencyDays != null;

  const getStatusLabel = () => {
    if (!hasSchedule) return 'No schedule';
    if (overdue) return 'Overdue';
    if (dueSoon) return 'Due soon';
    return 'On track';
  };

  const getStatusColor = () => {
    if (!hasSchedule) return 'text-muted-foreground';
    if (overdue) return 'text-red-500';
    if (dueSoon) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{chore.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{choreCompletions.length}</div>
              <div className="text-xs text-muted-foreground">Times completed</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className={cn("text-2xl font-bold", getStatusColor())}>
                {daysSince !== null ? daysSince : '--'}
              </div>
              <div className="text-xs text-muted-foreground">Days since last</div>
            </div>
          </div>

          {/* Details */}
          <div className="py-2 border-t text-sm space-y-1">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Frequency</span>
              <span>{hasSchedule ? `Every ${chore.frequencyDays} days` : 'Log-only'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Status</span>
              <span className={cn("font-medium", getStatusColor())}>{getStatusLabel()}</span>
            </div>
          </div>

          {/* Completion History */}
          <div className="py-2 border-t">
            <span className="text-sm font-medium block mb-2">Completion History</span>
            {choreCompletions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {choreCompletions.map((completion) => (
                  <div key={completion.id} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                    <div>
                      <div className="font-medium">
                        {format(new Date(completion.completedAt), 'dd MMM yyyy, HH:mm')}
                      </div>
                      {completion.notes && (
                        <div className="text-xs text-muted-foreground">{completion.notes}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteCompletion(completion.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Check, Pencil, Trash2 } from 'lucide-react';
import { Chore, ChoreCompletion, getDaysSinceLastDone, isOverdue, isDueSoon } from '@/types/chore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoreCardProps {
  chore: Chore;
  completions: ChoreCompletion[];
  onShowInfo: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}

export function ChoreCard({
  chore,
  completions,
  onShowInfo,
  onEdit,
  onDelete,
  onMarkDone,
}: ChoreCardProps) {
  const daysSince = getDaysSinceLastDone(chore.id, completions);
  const overdue = isOverdue(chore, completions);
  const dueSoon = isDueSoon(chore, completions);
  const hasSchedule = chore.frequencyDays != null;

  const getStatusColor = () => {
    if (!hasSchedule) return 'bg-muted-foreground';
    if (overdue) return 'bg-red-500';
    if (dueSoon) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getLastDoneText = () => {
    if (daysSince === null) return 'Never';
    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return '1 day ago';
    return `${daysSince} days ago`;
  };

  const getNextDueText = () => {
    if (!hasSchedule) return 'No schedule';
    if (daysSince === null) return 'Overdue';
    const daysUntil = chore.frequencyDays! - daysSince;
    if (daysUntil <= 0) return 'Overdue';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  return (
    <div
      className={cn(
        "glass-card rounded-lg p-3 animate-fade-in transition-all duration-200",
        overdue && "border-destructive/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusColor())} />

        {/* Chore info - tappable area */}
        <button
          onClick={onShowInfo}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="font-medium text-base truncate">{chore.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {getLastDoneText()} &middot; {getNextDueText()}
          </p>
        </button>

        {/* Done button */}
        <button
          onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 flex items-center justify-center transition-all flex-shrink-0"
        >
          <Check className="w-5 h-5" />
        </button>

        {/* Edit/Delete */}
        <div className="flex items-center gap-1 flex-shrink-0 border-l border-border/30 pl-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-10 w-10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

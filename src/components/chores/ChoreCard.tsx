import { Check } from 'lucide-react';
import { Chore, ChoreCompletion, getDaysSinceLastDone, isOverdue, isDueSoon } from '@/types/chore';
import { cn } from '@/lib/utils';

interface ChoreCardProps {
  chore: Chore;
  completions: ChoreCompletion[];
  onShowInfo: () => void;
  onMarkDone: () => void;
}

export function ChoreCard({
  chore,
  completions,
  onShowInfo,
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
      {/* Top row: chore name + status */}
      <button
        onClick={onShowInfo}
        className="w-full text-left mb-2"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getStatusColor())} />
          <h3 className="font-medium text-base">{chore.name}</h3>
        </div>
        <p className="text-xs text-muted-foreground ml-[18px]">
          {getLastDoneText()} &middot; {getNextDueText()}
        </p>
      </button>

      {/* Bottom row: done button, right-aligned */}
      <div className="flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
          className="h-10 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 flex items-center gap-2 transition-all"
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Done</span>
        </button>
      </div>
    </div>
  );
}

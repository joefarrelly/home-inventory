import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { Chore, ChoreCompletion, getNextDueDate, isOverdue } from '@/types/chore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoreCalendarProps {
  chores: Chore[];
  completions: ChoreCompletion[];
  onSelectChore: (chore: Chore) => void;
  onMarkDone: (chore: Chore) => void;
}

export function ChoreCalendar({
  chores,
  completions,
  onSelectChore,
  onMarkDone,
}: ChoreCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of date string -> chores due on that day
  const choresByDate = useMemo(() => {
    const map = new Map<string, Chore[]>();
    chores.forEach(chore => {
      if (!chore.frequencyDays) return;
      const nextDue = getNextDueDate(chore, completions);
      if (!nextDue) return;

      // For the calendar, show the next due date and also recurring future instances
      // within the visible month range
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const viewStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      // Start from the next due date and project forward
      let date = new Date(nextDue);
      // If the due date is before the view, advance by frequency until within range
      while (date < viewStart) {
        date = new Date(date);
        date.setDate(date.getDate() + chore.frequencyDays);
      }

      // Add all occurrences within the visible range
      while (date <= viewEnd) {
        const key = format(date, 'yyyy-MM-dd');
        const existing = map.get(key) || [];
        existing.push(chore);
        map.set(key, existing);
        date = new Date(date);
        date.setDate(date.getDate() + chore.frequencyDays);
      }
    });
    return map;
  }, [chores, completions, currentMonth]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Chores for selected date
  const selectedDateChores = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return choresByDate.get(key) || [];
  }, [selectedDate, choresByDate]);

  // Overdue chores (always show above calendar)
  const overdueChores = useMemo(() => {
    return chores.filter(c => isOverdue(c, completions));
  }, [chores, completions]);

  const getDotColor = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayChores = choresByDate.get(key) || [];
    if (dayChores.length === 0) return null;

    // If any are overdue (due date is in the past or today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayClean = new Date(day);
    dayClean.setHours(0, 0, 0, 0);

    if (dayClean < today) return 'bg-red-500';
    if (dayClean.getTime() === today.getTime()) {
      return dayChores.some(c => isOverdue(c, completions)) ? 'bg-red-500' : 'bg-amber-500';
    }
    // Check if within 2 days from today
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    if (dayClean <= twoDaysFromNow) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-3">
      {/* Overdue banner */}
      {overdueChores.length > 0 && !selectedDate && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm font-medium text-red-500 mb-2">
            {overdueChores.length} overdue
          </p>
          <div className="space-y-1.5">
            {overdueChores.map(chore => (
              <div key={chore.id} className="flex items-center justify-between">
                <button
                  onClick={() => onSelectChore(chore)}
                  className="text-sm text-left truncate flex-1 min-w-0 hover:underline"
                >
                  {chore.name}
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs ml-2 flex-shrink-0"
                  onClick={() => onMarkDone(chore)}
                >
                  Done
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="h-8 w-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="h-8 w-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-0">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayChores = choresByDate.get(key) || [];
          const dotColor = getDotColor(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && "hover:bg-secondary/60",
                isToday(day) && !isSelected && "ring-2 ring-primary font-bold",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <span>{format(day, 'd')}</span>
              {dotColor && !isSelected && (
                <div className="absolute bottom-1 flex gap-0.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                  {dayChores.length > 1 && (
                    <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                  )}
                  {dayChores.length > 2 && (
                    <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                  )}
                </div>
              )}
              {dotColor && isSelected && (
                <div className="absolute bottom-1 flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  {dayChores.length > 1 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date chores */}
      {selectedDate && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">
            {format(selectedDate, 'EEEE, d MMMM')}
          </p>
          {selectedDateChores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chores due this day.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedDateChores.map(chore => (
                <div key={chore.id} className="flex items-center justify-between glass-card rounded-lg p-2.5">
                  <button
                    onClick={() => onSelectChore(chore)}
                    className="text-sm font-medium text-left truncate flex-1 min-w-0 hover:underline"
                  >
                    {chore.name}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs ml-2 flex-shrink-0"
                    onClick={() => onMarkDone(chore)}
                  >
                    Done
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

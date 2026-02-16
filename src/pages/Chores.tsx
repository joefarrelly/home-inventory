import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, ClipboardCheck, List, CalendarDays } from 'lucide-react';
import { useChores } from '@/hooks/useChores';
import { useChoreHistory } from '@/hooks/useChoreHistory';
import { Chore, isOverdue, isDueSoon, getDaysSinceLastDone } from '@/types/chore';
import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreFormDialog } from '@/components/chores/ChoreFormDialog';
import { ChoreInfoDialog } from '@/components/chores/ChoreInfoDialog';
import { ChoreCalendar } from '@/components/chores/ChoreCalendar';
import { DeleteConfirmDialog } from '@/components/inventory/DeleteConfirmDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const Chores = () => {
  const { chores, addChore, updateChore, deleteChore } = useChores();
  const { completions, addCompletion, deleteCompletion } = useChoreHistory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [deletingChore, setDeletingChore] = useState<Chore | null>(null);
  const [infoChore, setInfoChore] = useState<Chore | null>(null);
  const [confirmingDoneChore, setConfirmingDoneChore] = useState<Chore | null>(null);
  const [doneNotes, setDoneNotes] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Counts
  const overdueCount = useMemo(() => chores.filter(c => isOverdue(c, completions)).length, [chores, completions]);
  const dueSoonCount = useMemo(() => chores.filter(c => isDueSoon(c, completions)).length, [chores, completions]);

  // Filter and sort chores for list view
  const filteredChores = useMemo(() => {
    let result = chores.filter(chore => {
      if (!selectedFilter) return true;
      if (selectedFilter === 'overdue') return isOverdue(chore, completions);
      if (selectedFilter === 'due-soon') return isDueSoon(chore, completions);
      return true;
    });

    // Sort: overdue first (most overdue at top), then due soon, then rest alphabetical.
    // Log-only chores sorted alphabetically at the end.
    result = [...result].sort((a, b) => {
      const aHasSchedule = a.frequencyDays != null;
      const bHasSchedule = b.frequencyDays != null;

      if (aHasSchedule && !bHasSchedule) return -1;
      if (!aHasSchedule && bHasSchedule) return 1;
      if (!aHasSchedule && !bHasSchedule) return a.name.localeCompare(b.name);

      const aOverdue = isOverdue(a, completions);
      const bOverdue = isOverdue(b, completions);
      const aDueSoon = isDueSoon(a, completions);
      const bDueSoon = isDueSoon(b, completions);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      if (aOverdue && bOverdue) {
        const aDays = getDaysSinceLastDone(a.id, completions) ?? Infinity;
        const bDays = getDaysSinceLastDone(b.id, completions) ?? Infinity;
        const aOverdueBy = aDays - (a.frequencyDays ?? 0);
        const bOverdueBy = bDays - (b.frequencyDays ?? 0);
        return bOverdueBy - aOverdueBy;
      }

      if (aDueSoon && !bDueSoon) return -1;
      if (!aDueSoon && bDueSoon) return 1;

      return a.name.localeCompare(b.name);
    });

    return result;
  }, [chores, completions, selectedFilter]);

  const handleAddChore = (data: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    addChore(data);
  };

  const handleEditChore = (data: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingChore) {
      updateChore(editingChore.id, data);
      setEditingChore(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingChore) {
      deleteChore(deletingChore.id);
      setDeletingChore(null);
    }
  };

  const openEditDialog = (chore: Chore) => {
    setEditingChore(chore);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingChore(null);
  };

  const handleMarkDone = (chore: Chore) => {
    setDoneNotes('');
    setConfirmingDoneChore(chore);
  };

  const handleConfirmDone = () => {
    if (confirmingDoneChore) {
      addCompletion(confirmingDoneChore.id, confirmingDoneChore.name, doneNotes.trim() || undefined);
      setConfirmingDoneChore(null);
      setDoneNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Chores</h1>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="icon"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => { setViewMode('list'); setSelectedFilter(null); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
              viewMode === 'list'
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            )}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
              viewMode === 'calendar'
                ? "bg-background shadow-sm"
                : "hover:bg-background/50"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Status filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <button
                onClick={() => setSelectedFilter(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedFilter === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                All ({chores.length})
              </button>
              <button
                onClick={() => setSelectedFilter('overdue')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedFilter === 'overdue'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                Overdue ({overdueCount})
              </button>
              <button
                onClick={() => setSelectedFilter('due-soon')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedFilter === 'due-soon'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                Due Soon ({dueSoonCount})
              </button>
            </div>

            {/* Chores List */}
            <div className="space-y-2">
              {filteredChores.length === 0 ? (
                <div className="glass-card rounded-lg p-12 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No chores found</h3>
                  <p className="text-muted-foreground mb-4">
                    {chores.length === 0
                      ? "Get started by adding your first chore"
                      : "Try adjusting your filter"}
                  </p>
                  {chores.length === 0 && (
                    <Button onClick={() => setIsFormOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Chore
                    </Button>
                  )}
                </div>
              ) : (
                filteredChores.map((chore) => (
                  <ChoreCard
                    key={chore.id}
                    chore={chore}
                    completions={completions}
                    onShowInfo={() => setInfoChore(chore)}
                    onEdit={() => openEditDialog(chore)}
                    onDelete={() => setDeletingChore(chore)}
                    onMarkDone={() => handleMarkDone(chore)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* Calendar View */
          <ChoreCalendar
            chores={chores}
            completions={completions}
            onSelectChore={(chore) => setInfoChore(chore)}
            onMarkDone={handleMarkDone}
          />
        )}

        {/* Dialogs */}
        <ChoreFormDialog
          open={isFormOpen}
          onOpenChange={closeFormDialog}
          chore={editingChore}
          onSubmit={editingChore ? handleEditChore : handleAddChore}
        />

        <AlertDialog open={!!confirmingDoneChore} onOpenChange={(open) => !open && setConfirmingDoneChore(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Done</AlertDialogTitle>
              <AlertDialogDescription>
                Mark "{confirmingDoneChore?.name}" as done?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Notes (optional)"
              value={doneNotes}
              onChange={(e) => setDoneNotes(e.target.value)}
              className="min-h-[60px]"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDone}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DeleteConfirmDialog
          open={!!deletingChore}
          onOpenChange={(open) => !open && setDeletingChore(null)}
          itemName={deletingChore?.name || ''}
          onConfirm={handleDeleteConfirm}
        />

        <ChoreInfoDialog
          open={!!infoChore}
          onOpenChange={(open) => !open && setInfoChore(null)}
          chore={infoChore}
          completions={completions}
          onDeleteCompletion={deleteCompletion}
        />
      </div>
    </div>
  );
};

export default Chores;

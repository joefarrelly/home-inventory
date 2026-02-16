import { useState, useEffect } from 'react';
import { Chore } from '@/types/chore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chore?: Chore | null;
  onSubmit: (data: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ChoreFormDialog({
  open,
  onOpenChange,
  chore,
  onSubmit,
}: ChoreFormDialogProps) {
  const [name, setName] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('');

  useEffect(() => {
    if (chore) {
      setName(chore.name);
      setFrequencyDays(chore.frequencyDays != null ? String(chore.frequencyDays) : '');
    } else {
      setName('');
      setFrequencyDays('');
    }
  }, [chore, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      frequencyDays: frequencyDays.trim() ? parseInt(frequencyDays, 10) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{chore ? 'Edit Chore' : 'Add New Chore'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chore-name">Name</Label>
            <Input
              id="chore-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Change bedding"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chore-frequency">Frequency (days)</Label>
            <Input
              id="chore-frequency"
              type="number"
              min="1"
              value={frequencyDays}
              onChange={(e) => setFrequencyDays(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Leave blank for log-only"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to just log when done, without a schedule.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {chore ? 'Save Changes' : 'Add Chore'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

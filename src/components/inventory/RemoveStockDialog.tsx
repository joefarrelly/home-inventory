import { useState, useEffect } from 'react';
import { InventoryItem, getUnassignedQuantity } from '@/types/inventory';
import { Location } from '@/hooks/useSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RemoveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  locations: Location[];
  onRemove: (amount: number, locationId: string | null) => void;
}

export function RemoveStockDialog({
  open,
  onOpenChange,
  item,
  locations,
  onRemove,
}: RemoveStockDialogProps) {
  const [amount, setAmount] = useState('1');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Get locations that have stock
  const unassigned = item ? getUnassignedQuantity(item) : 0;
  const locationBreakdown = item?.locationQuantities?.filter(lq => lq.quantity > 0) || [];

  // Build available sources (locations with stock + unassigned if any)
  const availableSources: { id: string; name: string; quantity: number }[] = [];

  locationBreakdown.forEach(lq => {
    const loc = locations.find(l => l.id === lq.locationId);
    availableSources.push({
      id: lq.locationId,
      name: loc?.name || lq.locationId,
      quantity: lq.quantity,
    });
  });

  if (unassigned > 0) {
    availableSources.push({
      id: '__unassigned__',
      name: 'Unassigned',
      quantity: unassigned,
    });
  }

  const needsLocationSelection = availableSources.length > 1;
  const selectedSource = availableSources.find(s => s.id === selectedLocation);
  const maxAmount = selectedSource?.quantity || item?.quantity || 0;

  useEffect(() => {
    if (open) {
      setAmount('1');
      // Auto-select if only one source
      if (availableSources.length === 1) {
        setSelectedLocation(availableSources[0].id);
      } else {
        setSelectedLocation('');
      }
    }
  }, [open, availableSources.length]);

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (needsLocationSelection && !selectedLocation) return;

    const locationId = selectedLocation === '__unassigned__' ? null : selectedLocation || null;
    onRemove(Math.min(parsedAmount, maxAmount), locationId);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Stock: {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {needsLocationSelection && (
            <div className="space-y-2">
              <Label>Remove from</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount to remove</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="1"
            />
            {selectedSource && (
              <p className="text-xs text-muted-foreground">
                Max: {selectedSource.quantity}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!amount || parseInt(amount, 10) <= 0 || (needsLocationSelection && !selectedLocation)}
            >
              Remove
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

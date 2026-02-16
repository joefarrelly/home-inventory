import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Location } from '@/hooks/useSettings';
import { InventoryItem, getUnassignedQuantity } from '@/types/inventory';

interface MoveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  locations: Location[];
  onConfirm: (fromLocationId: string | null, toLocationId: string, quantity: number) => void;
}

export function MoveLocationDialog({
  open,
  onOpenChange,
  item,
  locations,
  onConfirm,
}: MoveLocationDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const [fromLocation, setFromLocation] = useState<string>('unassigned');
  const [toLocation, setToLocation] = useState('');

  const handleQuantityChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  };

  const getMaxQuantity = (locationId?: string): number => {
    if (!item) return 0;
    const loc = locationId ?? fromLocation;
    if (loc === 'unassigned') {
      return getUnassignedQuantity(item);
    }
    return item.locationQuantities?.find(lq => lq.locationId === loc)?.quantity || 0;
  };

  // Auto-set quantity to max when dialog opens with unassigned stock
  useEffect(() => {
    if (open && item && fromLocation === 'unassigned') {
      const unassigned = getUnassignedQuantity(item);
      if (unassigned > 0) {
        setQuantity(unassigned.toString());
      }
    }
  }, [open, item]);

  const handleConfirm = () => {
    const qty = parseInt(quantity, 10);
    const maxQty = getMaxQuantity();
    
    if (qty > 0 && qty <= maxQty && toLocation && toLocation !== fromLocation) {
      onConfirm(
        fromLocation === 'unassigned' ? null : fromLocation,
        toLocation === 'unassigned' ? '' : toLocation,
        qty
      );
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setQuantity('1');
    setFromLocation('unassigned');
    setToLocation('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Build source options from item's current distribution
  const sourceOptions: { id: string; name: string; qty: number }[] = [];
  if (item) {
    const unassigned = getUnassignedQuantity(item);
    if (unassigned > 0) {
      sourceOptions.push({ id: 'unassigned', name: 'Unassigned', qty: unassigned });
    }
    item.locationQuantities?.forEach(lq => {
      if (lq.quantity > 0) {
        const loc = locations.find(l => l.id === lq.locationId);
        sourceOptions.push({ 
          id: lq.locationId, 
          name: loc?.name || lq.locationId, 
          qty: lq.quantity 
        });
      }
    });
  }

  // Destination options exclude the source
  const destOptions = [
    { id: 'unassigned', name: 'Unassigned' },
    ...locations.map(l => ({ id: l.id, name: l.name }))
  ].filter(opt => opt.id !== fromLocation);

  const maxQty = getMaxQuantity();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move: {item?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fromLocation">From</Label>
            <Select value={fromLocation} onValueChange={(v) => { setFromLocation(v); setQuantity(v === 'unassigned' ? getMaxQuantity('unassigned').toString() : '1'); }}>
              <SelectTrigger id="fromLocation">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name} ({opt.qty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (max: {maxQty})</Label>
            <Input
              id="quantity"
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toLocation">To</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger id="toLocation">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {destOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!quantity || parseInt(quantity, 10) <= 0 || parseInt(quantity, 10) > maxQty || !toLocation}
          >
            Move Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';

export interface Shop {
  id: string;
  name: string;
}

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  shops: Shop[];
  onConfirm: (quantity: number, unitPrice: number, shopId: string, isInitialStock?: boolean) => void;
}

export function AddStockDialog({
  open,
  onOpenChange,
  itemName,
  shops,
  onConfirm,
}: AddStockDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [shopId, setShopId] = useState('');
  const [lastEditedPrice, setLastEditedPrice] = useState<'unit' | 'total' | null>(null);
  const [isInitialStock, setIsInitialStock] = useState(false);

  const formatPrice = (value: number): string => {
    if (value === 0) return '';
    return value.toFixed(2).replace(/\.?0+$/, '');
  };

  const handleQuantityChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
      const qty = parseInt(value, 10);

      if (qty > 0) {
        if (lastEditedPrice === 'total' && totalPrice) {
          const total = parseFloat(totalPrice);
          if (!isNaN(total)) {
            setUnitPrice((total / qty).toFixed(3));
          }
        } else if (lastEditedPrice === 'unit' && unitPrice) {
          const unit = parseFloat(unitPrice);
          if (!isNaN(unit)) {
            setTotalPrice(formatPrice(unit * qty));
          }
        }
      }
    }
  };

  const handleUnitPriceChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
      setUnitPrice(value);
      setLastEditedPrice('unit');

      const qty = parseInt(quantity, 10);
      const unit = parseFloat(value);

      if (qty > 0 && !isNaN(unit)) {
        setTotalPrice(formatPrice(unit * qty));
      } else if (value === '') {
        setTotalPrice('');
      }
    }
  };

  const handleTotalPriceChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setTotalPrice(value);
      setLastEditedPrice('total');

      const qty = parseInt(quantity, 10);
      const total = parseFloat(value);

      if (qty > 0 && !isNaN(total)) {
        setUnitPrice((total / qty).toFixed(3));
      } else if (value === '') {
        setUnitPrice('');
      }
    }
  };

  const handleConfirm = () => {
    const qty = parseInt(quantity, 10);
    const price = parseFloat(unitPrice) || 0;

    if (qty > 0 && (isInitialStock || shopId)) {
      onConfirm(qty, price, shopId, isInitialStock);
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setQuantity('1');
    setUnitPrice('');
    setTotalPrice('');
    setShopId('');
    setLastEditedPrice(null);
    setIsInitialStock(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Stock: {itemName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="initial-stock" className="text-sm">
              Initial stock (no purchase record)
            </Label>
            <Switch
              id="initial-stock"
              checked={isInitialStock}
              onCheckedChange={setIsInitialStock}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          {!isInitialStock && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (£)</Label>
                  <Input
                    id="unitPrice"
                    type="text"
                    inputMode="decimal"
                    value={unitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Total Price (£)</Label>
                  <Input
                    id="totalPrice"
                    type="text"
                    inputMode="decimal"
                    value={totalPrice}
                    onChange={(e) => handleTotalPriceChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop">Shop</Label>
                <Select value={shopId} onValueChange={setShopId}>
                  <SelectTrigger id="shop">
                    <SelectValue placeholder="Select shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!quantity || parseInt(quantity, 10) <= 0 || (!isInitialStock && !shopId)}
          >
            Add Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

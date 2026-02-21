import { Minus, Plus } from 'lucide-react';
import { InventoryItem, Category } from '@/types/inventory';
import { UnitType, Location } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

interface InventoryItemCardProps {
  item: InventoryItem;
  categories: Category[];
  unitTypes: UnitType[];
  locations: Location[];
  displayQuantity: number;
  selectedFilter: string | null;
  onShowInfo: () => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
}

export function InventoryItemCard({
  item,
  categories,
  displayQuantity,
  selectedFilter,
  onShowInfo,
  onAddStock,
  onRemoveStock,
}: InventoryItemCardProps) {
  const category = categories.find(c => c.id === item.category);
  const isOutOfStock = item.quantity === 0;

  return (
    <div
      className={cn(
        "glass-card rounded-lg p-3 animate-fade-in transition-all duration-200",
        isOutOfStock && "border-destructive/50 opacity-60"
      )}
    >
      {/* Top row: item name + category */}
      <button
        onClick={onShowInfo}
        className="w-full text-left mb-2"
      >
        <h3 className="font-medium text-base">{item.name}</h3>
        <p className="text-xs text-muted-foreground">
          {category?.name || 'Uncategorized'}
        </p>
      </button>

      {/* Bottom row: quantity controls, right-aligned */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onRemoveStock}
          disabled={displayQuantity === 0}
          className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className={cn(
          "min-w-12 text-center",
          isOutOfStock && "text-destructive"
        )}>
          <span className="font-semibold text-lg">{displayQuantity}</span>
          {selectedFilter === null && item.quantity !== displayQuantity && (
            <span className="text-xs text-muted-foreground">/{item.quantity}</span>
          )}
        </div>

        <button
          onClick={onAddStock}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 flex items-center justify-center transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

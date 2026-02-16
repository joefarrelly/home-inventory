import { Minus, Plus, Pencil, Trash2 } from 'lucide-react';
import { InventoryItem, Category } from '@/types/inventory';
import { UnitType, Location } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InventoryItemCardProps {
  item: InventoryItem;
  categories: Category[];
  unitTypes: UnitType[];
  locations: Location[];
  displayQuantity: number;
  selectedFilter: string | null;
  onShowInfo: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
  onMoveLocation: () => void;
}

export function InventoryItemCard({
  item,
  categories,
  unitTypes,
  displayQuantity,
  selectedFilter,
  onShowInfo,
  onEdit,
  onDelete,
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
      <div className="flex items-center gap-3">
        {/* Item info - tappable area */}
        <button
          onClick={onShowInfo}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="font-medium text-base truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {category?.name || 'Uncategorized'}
          </p>
        </button>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRemoveStock}
            disabled={displayQuantity === 0}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className={cn(
            "min-w-[3rem] text-center",
            isOutOfStock && "text-destructive"
          )}>
            <span className="font-semibold text-lg">{displayQuantity}</span>
            {selectedFilter === null && item.quantity !== displayQuantity && (
              <span className="text-xs text-muted-foreground">/{item.quantity}</span>
            )}
          </div>

          <button
            onClick={onAddStock}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Edit/Delete */}
        <div className="flex items-center gap-1 flex-shrink-0 border-l pl-2 ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardCheck, Search, Plus, Minus, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useSettings } from '@/hooks/useSettings';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { useChores } from '@/hooks/useChores';
import { useChoreHistory } from '@/hooks/useChoreHistory';
import { InventoryItem } from '@/types/inventory';
import { Chore, isOverdue, getNextDueDate } from '@/types/chore';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { RemoveStockDialog } from '@/components/inventory/RemoveStockDialog';
import { Textarea } from '@/components/ui/textarea';
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
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const { items, incrementQuantity, decrementQuantity } = useInventory();
  const { unitTypes, locations, shops } = useSettings();
  const { addPurchase } = usePurchaseHistory();
  const { chores } = useChores();
  const { completions, addCompletion } = useChoreHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [addStockItem, setAddStockItem] = useState<InventoryItem | null>(null);
  const [removeStockItem, setRemoveStockItem] = useState<InventoryItem | null>(null);
  const [confirmingDoneChore, setConfirmingDoneChore] = useState<Chore | null>(null);
  const [doneNotes, setDoneNotes] = useState('');

  // Overdue chores
  const overdueChores = useMemo(
    () => chores.filter(c => isOverdue(c, completions)),
    [chores, completions]
  );

  // Upcoming chores (non-overdue, scheduled, sorted by next due date)
  const upcomingChores = useMemo(() => {
    const now = new Date();
    return chores
      .filter(c => c.frequencyDays && !isOverdue(c, completions))
      .map(c => ({ chore: c, dueDate: getNextDueDate(c, completions)! }))
      .filter(x => x.dueDate !== null)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5)
      .map(x => {
        const diffDays = Math.ceil((x.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...x, daysUntilDue: diffDays };
      });
  }, [chores, completions]);

  // Stock alerts
  const outOfStockItems = useMemo(() => items.filter(i => i.quantity === 0), [items]);
  const lowStockItems = useMemo(
    () => items.filter(i => i.minQuantity != null && i.quantity > 0 && i.quantity <= i.minQuantity),
    [items]
  );

  // Quick search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return items
      .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [items, searchQuery]);

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

  const handleAddStock = (quantity: number, unitPrice: number, shopId: string, isInitialStock?: boolean) => {
    if (addStockItem) {
      incrementQuantity(addStockItem.id, quantity);
      if (!isInitialStock) {
        addPurchase({
          itemId: addStockItem.id,
          itemName: addStockItem.name,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          shop: shopId,
        });
      }
      setAddStockItem(null);
    }
  };

  const handleRemoveStock = (amount: number, locationId: string | null) => {
    if (removeStockItem) {
      decrementQuantity(removeStockItem.id, amount, locationId);
      setRemoveStockItem(null);
    }
  };

  const getUnitLabel = (item: InventoryItem) => {
    const unit = unitTypes.find(u => u.id === item.unit);
    if (!unit) return '';
    return item.quantity === 1 ? unit.singular : unit.plural;
  };

  const StockItemRow = ({ item }: { item: InventoryItem }) => (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium truncate block">{item.name}</span>
        <span className="text-xs text-muted-foreground">{item.quantity} {getUnitLabel(item)}</span>
      </div>
      <div className="flex gap-1 ml-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 active:scale-95 transition-all"
          onClick={() => setRemoveStockItem(item)}
          disabled={item.quantity === 0}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 active:scale-95 transition-all"
          onClick={() => setAddStockItem(item)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Home Inventory</h1>

        {/* Nav Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/inventory" className="block">
            <div className="glass-card rounded-lg p-4 hover:bg-secondary/50 transition-colors">
              <Package className="w-6 h-6 mb-2 text-primary" />
              <div className="font-medium">Inventory</div>
              <div className="text-sm text-muted-foreground">{items.length} items</div>
            </div>
          </Link>
          <Link to="/chores" className="block">
            <div className="glass-card rounded-lg p-4 hover:bg-secondary/50 transition-colors">
              <ClipboardCheck className="w-6 h-6 mb-2 text-primary" />
              <div className="font-medium">Chores</div>
              <div className="text-sm text-muted-foreground">{chores.length} chores</div>
            </div>
          </Link>
        </div>

        {/* Overdue Chores */}
        {overdueChores.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="font-bold text-destructive">Overdue Chores</h2>
            </div>
            <div className="space-y-2">
              {overdueChores.map(chore => (
                <div key={chore.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{chore.name}</span>
                  <Button size="sm" variant="outline" onClick={() => handleMarkDone(chore)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Done
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Chores */}
        {upcomingChores.length > 0 && (
          <div className="glass-card rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Upcoming Chores</h2>
            </div>
            <div className="space-y-2">
              {upcomingChores.map(({ chore, daysUntilDue }) => (
                <div key={chore.id} className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium">{chore.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {daysUntilDue <= 0 ? 'Due today' : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
          <div className="glass-card rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold">Stock Alerts</h2>
            </div>
            {outOfStockItems.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Out of Stock</h3>
                {outOfStockItems.map(item => (
                  <StockItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
            {lowStockItems.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low Stock</h3>
                {lowStockItems.map(item => (
                  <StockItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Stock Update */}
        <div className="glass-card rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Quick Stock Update</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="divide-y">
              {searchResults.map(item => (
                <StockItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No items found</p>
          )}
        </div>

        {/* Dialogs */}
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

        <AddStockDialog
          open={!!addStockItem}
          onOpenChange={(open) => !open && setAddStockItem(null)}
          itemName={addStockItem?.name || ''}
          shops={shops}
          onConfirm={handleAddStock}
        />

        <RemoveStockDialog
          open={!!removeStockItem}
          onOpenChange={(open) => !open && setRemoveStockItem(null)}
          item={removeStockItem}
          locations={locations}
          onRemove={handleRemoveStock}
        />
      </div>
    </div>
  );
};

export default Dashboard;

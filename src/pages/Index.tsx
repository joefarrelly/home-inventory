import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Package, Search, Settings, History, PoundSterling, MapPin, Tag, PackageOpen, Download, ClipboardCheck, ArrowLeft } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInventory } from '@/hooks/useInventory';
import { useSettings } from '@/hooks/useSettings';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { InventoryItem, getUnassignedQuantity } from '@/types/inventory';
import { InventoryItemCard } from '@/components/inventory/InventoryItemCard';
import { ItemFormDialog } from '@/components/inventory/ItemFormDialog';
import { DeleteConfirmDialog } from '@/components/inventory/DeleteConfirmDialog';
import { SettingsDialog } from '@/components/inventory/SettingsDialog';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { RemoveStockDialog } from '@/components/inventory/RemoveStockDialog';
import { MoveLocationDialog } from '@/components/inventory/MoveLocationDialog';
import { ItemInfoDialog } from '@/components/inventory/ItemInfoDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Index = () => {
  const { items, addItem, updateItem, deleteItem, incrementQuantity, decrementQuantity, moveBetweenLocations } = useInventory();
  const {
    categories,
    unitTypes,
    locations,
    shops,
    addCategory,
    removeCategory,
    addUnitType,
    removeUnitType,
    addLocation,
    removeLocation,
    addShop,
    removeShop,
  } = useSettings();
  const { purchases, addPurchase } = usePurchaseHistory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabMode, setTabMode] = useState<'location' | 'category' | 'stock'>('category');

  // Add stock dialog state
  const [addStockItem, setAddStockItem] = useState<InventoryItem | null>(null);

  // Remove stock dialog state
  const [removeStockItem, setRemoveStockItem] = useState<InventoryItem | null>(null);

  // Move location dialog state
  const [moveLocationItem, setMoveLocationItem] = useState<InventoryItem | null>(null);

  // Info dialog state
  const [infoItem, setInfoItem] = useState<InventoryItem | null>(null);

  // Menu sheet state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // URL params for deep linking (NFC tags, etc.)
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL parameters for deep linking
  useEffect(() => {
    const itemId = searchParams.get('item');
    const action = searchParams.get('action');

    if (!itemId && !action) return;

    // Wait for items to load
    if (items.length === 0) return;

    const item = itemId ? items.find(i => i.id === itemId || i.name.toLowerCase().replace(/\s+/g, '-') === itemId.toLowerCase()) : null;

    if (action === 'new') {
      setIsFormOpen(true);
      setSearchParams({});
    } else if (action === 'add' && item) {
      setAddStockItem(item);
      setSearchParams({});
    } else if (action === 'remove' && item) {
      setRemoveStockItem(item);
      setSearchParams({});
    } else if (item) {
      setInfoItem(item);
      setSearchParams({});
    }
  }, [searchParams, items, setSearchParams]);

  // Get locations that have items (for tabs)
  const locationsWithItems = useMemo(() => {
    const locationIds = new Set<string>();
    items.forEach(item => {
      item.locationQuantities?.forEach(lq => {
        if (lq.quantity > 0) locationIds.add(lq.locationId);
      });
      if (getUnassignedQuantity(item) > 0) locationIds.add('unassigned');
    });
    return locations.filter(l => locationIds.has(l.id));
  }, [items, locations]);

  // Check if there are unassigned items
  const hasUnassigned = useMemo(() => {
    return items.some(item => getUnassignedQuantity(item) > 0);
  }, [items]);

  // Get categories that have items
  const categoriesWithItems = useMemo(() => {
    const catIds = new Set(items.map(item => item.category));
    return categories.filter(c => catIds.has(c.id));
  }, [items, categories]);

  // Stock tab counts
  const outOfStockCount = useMemo(() => items.filter(i => i.quantity === 0).length, [items]);
  const lowStockCount = useMemo(() => items.filter(i => i.minQuantity != null && i.quantity > 0 && i.quantity <= i.minQuantity).length, [items]);

  // Filter items by category/location/stock and search
  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      // Tab filter
      if (selectedFilter) {
        if (tabMode === 'location') {
          if (selectedFilter === 'unassigned') {
            if (getUnassignedQuantity(item) === 0) return false;
          } else {
            const hasQuantityInLocation = item.locationQuantities?.some(
              lq => lq.locationId === selectedFilter && lq.quantity > 0
            );
            if (!hasQuantityInLocation) return false;
          }
        } else if (tabMode === 'stock') {
          if (selectedFilter === 'out') {
            if (item.quantity !== 0) return false;
          } else if (selectedFilter === 'low') {
            if (!(item.minQuantity != null && item.quantity > 0 && item.quantity <= item.minQuantity)) return false;
          }
        } else {
          // Category mode
          if (item.category !== selectedFilter) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const matchesName = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const category = categories.find(c => c.id === item.category);
        const matchesCategory = category?.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesName && !matchesCategory) return false;
      }

      return true;
    });

    // Sort: stock mode by quantity ascending then alphabetical, otherwise just alphabetical
    if (tabMode === 'stock') {
      result = [...result].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [items, selectedFilter, searchQuery, categories, tabMode]);

  // Get quantity to display for current location filter
  const getDisplayQuantity = (item: InventoryItem) => {
    if (tabMode === 'location') {
      if (selectedFilter === 'unassigned') {
        return getUnassignedQuantity(item);
      } else if (selectedFilter) {
        return item.locationQuantities?.find(lq => lq.locationId === selectedFilter)?.quantity || 0;
      }
    }
    return item.quantity;
  };

  const handleAddItem = (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    addItem(data);
  };

  const handleEditItem = (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
      setEditingItem(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleAddStock = (quantity: number, unitPrice: number, shopId: string, isInitialStock?: boolean) => {
    if (addStockItem) {
      // Add to inventory
      incrementQuantity(addStockItem.id, quantity);

      // Log the purchase (skip for initial stock)
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

  const handleMoveLocation = (fromLocationId: string | null, toLocationId: string, quantity: number) => {
    if (moveLocationItem) {
      moveBetweenLocations(moveLocationItem.id, fromLocationId, toLocationId, quantity);
      setMoveLocationItem(null);
    }
  };

  const handleRemoveStock = (amount: number, locationId: string | null) => {
    if (removeStockItem) {
      decrementQuantity(removeStockItem.id, amount, locationId);
      setRemoveStockItem(null);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Inventory</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Sheet */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 py-4">
              <button
                onClick={() => { setIsMenuOpen(false); setIsFormOpen(true); }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="font-medium">Add New Item</span>
              </button>
              <Link
                to="/chores"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Chores</span>
              </Link>
              <Link
                to="/prices"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <PoundSterling className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Price Comparison</span>
              </Link>
              <Link
                to="/history"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <History className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Purchase History</span>
              </Link>
              <button
                onClick={() => { setIsMenuOpen(false); handleExportCsv(); }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <Download className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Export CSV</span>
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-secondary/50 active:bg-secondary/80 transition-colors"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tab Mode Toggle + Tabs */}
        <div className="space-y-2">
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setTabMode('category'); setSelectedFilter(null); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
                tabMode === 'category'
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <Tag className="w-3.5 h-3.5" />
              Category
            </button>
            <button
              onClick={() => { setTabMode('location'); setSelectedFilter(null); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
                tabMode === 'location'
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              Location
            </button>
            <button
              onClick={() => { setTabMode('stock'); setSelectedFilter(null); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors",
                tabMode === 'stock'
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <PackageOpen className="w-3.5 h-3.5" />
              Stock
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedFilter(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                selectedFilter === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              All ({items.length})
            </button>

            {tabMode === 'category' ? (
              // Category tabs
              categoriesWithItems.map(cat => {
                const count = items.filter(item => item.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilter(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                      selectedFilter === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })
            ) : tabMode === 'location' ? (
              // Location tabs
              <>
                {locationsWithItems.map(location => {
                  const count = items.filter(item =>
                    item.locationQuantities?.some(lq => lq.locationId === location.id && lq.quantity > 0)
                  ).length;
                  return (
                    <button
                      key={location.id}
                      onClick={() => setSelectedFilter(location.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                        selectedFilter === location.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                    >
                      {location.name} ({count})
                    </button>
                  );
                })}
                {hasUnassigned && (
                  <button
                    onClick={() => setSelectedFilter('unassigned')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                      selectedFilter === 'unassigned'
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    Unassigned ({items.filter(i => getUnassignedQuantity(i) > 0).length})
                  </button>
                )}
              </>
            ) : (
              // Stock tabs
              <>
                <button
                  onClick={() => setSelectedFilter('out')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                    selectedFilter === 'out'
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  Out of Stock ({outOfStockCount})
                </button>
                <button
                  onClick={() => setSelectedFilter('low')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                    selectedFilter === 'low'
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  Low Stock ({lowStockCount})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="glass-card rounded-lg p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                {items.length === 0
                  ? "Get started by adding your first item"
                  : "Try adjusting your search or location filter"}
              </p>
              {items.length === 0 && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                categories={categories}
                unitTypes={unitTypes}
                locations={locations}
                displayQuantity={getDisplayQuantity(item)}
                selectedFilter={selectedFilter}
                onShowInfo={() => setInfoItem(item)}
                onAddStock={() => setAddStockItem(item)}
                onRemoveStock={() => setRemoveStockItem(item)}
              />
            ))
          )}
        </div>

        {/* Dialogs */}
        <ItemFormDialog
          open={isFormOpen}
          onOpenChange={closeFormDialog}
          item={editingItem}
          onSubmit={editingItem ? handleEditItem : handleAddItem}
          categories={categories}
          unitTypes={unitTypes}
        />

        <DeleteConfirmDialog
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          itemName={deletingItem?.name || ''}
          onConfirm={handleDeleteConfirm}
        />

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          categories={categories}
          unitTypes={unitTypes}
          locations={locations}
          shops={shops}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onAddUnitType={addUnitType}
          onRemoveUnitType={removeUnitType}
          onAddLocation={addLocation}
          onRemoveLocation={removeLocation}
          onAddShop={addShop}
          onRemoveShop={removeShop}
        />

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

        <MoveLocationDialog
          open={!!moveLocationItem}
          onOpenChange={(open) => !open && setMoveLocationItem(null)}
          item={moveLocationItem}
          locations={locations}
          onConfirm={handleMoveLocation}
        />

        <ItemInfoDialog
          open={!!infoItem}
          onOpenChange={(open) => !open && setInfoItem(null)}
          item={infoItem}
          categories={categories}
          unitTypes={unitTypes}
          locations={locations}
          purchases={purchases}
          shops={shops}
          onMoveLocation={() => {
            if (infoItem) {
              setMoveLocationItem(infoItem);
              setInfoItem(null);
            }
          }}
          onEdit={() => {
            if (infoItem) {
              openEditDialog(infoItem);
              setInfoItem(null);
            }
          }}
          onDelete={() => {
            if (infoItem) {
              setDeletingItem(infoItem);
              setInfoItem(null);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Index;

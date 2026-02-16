import { format } from 'date-fns';
import { InventoryItem, getUnassignedQuantity } from '@/types/inventory';
import { Category } from '@/types/inventory';
import { UnitType, Location, Shop } from '@/hooks/useSettings';
import { PurchaseLog } from '@/types/purchaseLog';
import { TrendingDown, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ItemInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  categories: Category[];
  unitTypes: UnitType[];
  locations: Location[];
  purchases: PurchaseLog[];
  shops: Shop[];
  onMoveLocation?: () => void;
}

export function ItemInfoDialog({
  open,
  onOpenChange,
  item,
  categories,
  unitTypes,
  locations,
  purchases,
  shops,
  onMoveLocation,
}: ItemInfoDialogProps) {
  if (!item) return null;

  const category = categories.find(c => c.id === item.category);
  const unitType = unitTypes.find(u => u.id === item.unit);
  const unassigned = getUnassignedQuantity(item);
  const locationBreakdown = item.locationQuantities?.filter(lq => lq.quantity > 0) || [];

  // Get all purchases for this item
  const itemPurchases = purchases
    .filter(p => p.itemId === item.id)
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

  // Calculate price stats by shop
  const shopStats = itemPurchases.reduce((acc, purchase) => {
    if (!acc[purchase.shop]) {
      acc[purchase.shop] = { total: 0, count: 0, prices: [] };
    }
    acc[purchase.shop].total += purchase.unitPrice;
    acc[purchase.shop].count += 1;
    acc[purchase.shop].prices.push(purchase.unitPrice);
    return acc;
  }, {} as Record<string, { total: number; count: number; prices: number[] }>);

  // Find cheapest shop
  const shopAverages = Object.entries(shopStats).map(([shopId, stats]) => ({
    shopId,
    average: stats.total / stats.count,
    count: stats.count,
    lastPrice: stats.prices[0],
  }));
  shopAverages.sort((a, b) => a.average - b.average);
  const cheapestShopId = shopAverages[0]?.shopId;

  const unitLabel = item.quantity === 1
    ? (unitType?.singular || 'Item')
    : (unitType?.plural || 'Items');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{item.quantity}</div>
              <div className="text-xs text-muted-foreground">{unitLabel} in stock</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{itemPurchases.length}</div>
              <div className="text-xs text-muted-foreground">Purchases logged</div>
            </div>
          </div>

          {/* Shop Price Comparison */}
          {shopAverages.length > 0 && (
            <div className="py-2 border-t">
              <span className="text-sm font-medium block mb-2">Price by Shop</span>
              <div className="space-y-2">
                {shopAverages.map(({ shopId, average, count }) => {
                  const shop = shops.find(s => s.id === shopId);
                  const isCheapest = shopId === cheapestShopId && shopAverages.length > 1;
                  return (
                    <div
                      key={shopId}
                      className={cn(
                        "flex justify-between items-center p-2 rounded-lg text-sm",
                        isCheapest ? "bg-green-500/10 border border-green-500/30" : "bg-secondary/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isCheapest && <TrendingDown className="w-4 h-4 text-green-500" />}
                        <span className={cn(isCheapest && "font-medium")}>
                          {shop?.name || shopId}
                        </span>
                        <span className="text-xs text-muted-foreground">({count}x)</span>
                      </div>
                      <span className={cn("font-medium", isCheapest && "text-green-500")}>
                        £{average.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Purchases */}
          {itemPurchases.length > 0 && (
            <div className="py-2 border-t">
              <span className="text-sm font-medium block mb-2">Purchase History</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {itemPurchases.slice(0, 10).map((purchase, index) => {
                  const shop = shops.find(s => s.id === purchase.shop);
                  return (
                    <div key={purchase.id} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                      <div>
                        <div className="font-medium">{purchase.quantity}x @ £{purchase.unitPrice.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {shop?.name} • {format(new Date(purchase.purchasedAt), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">£{purchase.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
                {itemPurchases.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{itemPurchases.length - 10} more purchases
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Breakdown */}
          {(locationBreakdown.length > 0 || unassigned > 0) && (
            <div className="py-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Locations</span>
                {onMoveLocation && item.quantity > 0 && (
                  <Button variant="outline" size="sm" onClick={onMoveLocation}>
                    <MapPin className="w-3 h-3 mr-1" />
                    Move
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {locationBreakdown.map(lq => {
                  const loc = locations.find(l => l.id === lq.locationId);
                  return (
                    <div key={lq.locationId} className="flex justify-between text-sm">
                      <span>{loc?.name || lq.locationId}</span>
                      <span>{lq.quantity}</span>
                    </div>
                  );
                })}
                {unassigned > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Unassigned</span>
                    <span>{unassigned}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="py-2 border-t text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Category</span>
              <span>{category?.name || 'Uncategorized'}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

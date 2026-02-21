import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingDown, Search } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useSettings } from '@/hooks/useSettings';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Prices = () => {
  const { items } = useInventory();
  const { shops } = useSettings();
  const { purchases } = usePurchaseHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);

  // Calculate price data for all items
  const itemPriceData = useMemo(() => {
    const data: Array<{
      itemId: string;
      itemName: string;
      shopPrices: Array<{ shopId: string; average: number; count: number; lastPrice: number }>;
      cheapestShopId: string | null;
      hasPurchases: boolean;
    }> = [];

    items.forEach(item => {
      const itemPurchases = purchases.filter(p => p.itemId === item.id);

      if (itemPurchases.length === 0) {
        data.push({
          itemId: item.id,
          itemName: item.name,
          shopPrices: [],
          cheapestShopId: null,
          hasPurchases: false,
        });
        return;
      }

      // Group by shop
      const shopStats = itemPurchases.reduce((acc, purchase) => {
        if (!acc[purchase.shop]) {
          acc[purchase.shop] = { total: 0, count: 0, prices: [] };
        }
        acc[purchase.shop].total += purchase.unitPrice;
        acc[purchase.shop].count += 1;
        acc[purchase.shop].prices.push({ price: purchase.unitPrice, date: purchase.purchasedAt });
        return acc;
      }, {} as Record<string, { total: number; count: number; prices: Array<{ price: number; date: Date }> }>);

      const shopPrices = Object.entries(shopStats)
        .map(([shopId, stats]) => ({
          shopId,
          average: stats.total / stats.count,
          count: stats.count,
          lastPrice: stats.prices.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0].price,
        }))
        .sort((a, b) => a.average - b.average);

      data.push({
        itemId: item.id,
        itemName: item.name,
        shopPrices,
        cheapestShopId: shopPrices[0]?.shopId || null,
        hasPurchases: true,
      });
    });

    return data;
  }, [items, purchases]);

  // Filter items
  const filteredData = useMemo(() => {
    return itemPriceData.filter(item => {
      // Only show items with purchases
      if (!item.hasPurchases) return false;

      // Search filter
      if (searchQuery && !item.itemName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Shop filter - show items that have been bought at this shop
      if (selectedShop && !item.shopPrices.some(sp => sp.shopId === selectedShop)) {
        return false;
      }

      return true;
    });
  }, [itemPriceData, searchQuery, selectedShop]);

  // Get shops that have purchases
  const shopsWithPurchases = useMemo(() => {
    const shopIds = new Set(purchases.map(p => p.shop));
    return shops.filter(s => shopIds.has(s.id));
  }, [shops, purchases]);

  // Calculate which shop is cheapest for the most items
  const shopWinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(item => {
      if (item.cheapestShopId && item.shopPrices.length > 1) {
        counts[item.cheapestShopId] = (counts[item.cheapestShopId] || 0) + 1;
      }
    });
    return counts;
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Price Comparison</h1>
        </div>

        {/* Shop Summary */}
        {shopsWithPurchases.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {shopsWithPurchases.map(shop => {
              const winCount = shopWinCounts[shop.id] || 0;
              return (
                <div
                  key={shop.id}
                  className="bg-secondary/50 rounded-lg p-3 text-center"
                >
                  <div className="font-medium truncate">{shop.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Cheapest for {winCount} item{winCount !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

        {/* Shop Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedShop(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
              selectedShop === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            All Shops
          </button>
          {shopsWithPurchases.map(shop => (
            <button
              key={shop.id}
              onClick={() => setSelectedShop(shop.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                selectedShop === shop.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              {shop.name}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No price data yet.</p>
              <p className="text-sm mt-1">Add stock with prices to see comparisons.</p>
            </div>
          ) : (
            filteredData.map(item => (
              <div key={item.itemId} className="glass-card rounded-lg p-3">
                <h3 className="font-medium mb-2">{item.itemName}</h3>
                <div className="flex flex-wrap gap-2">
                  {item.shopPrices.map(({ shopId, average, count }) => {
                    const shop = shops.find(s => s.id === shopId);
                    const isCheapest = shopId === item.cheapestShopId && item.shopPrices.length > 1;
                    return (
                      <div
                        key={shopId}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                          isCheapest
                            ? "bg-green-500/20 text-green-500 border border-green-500/30"
                            : "bg-secondary"
                        )}
                      >
                        {isCheapest && <TrendingDown className="w-3 h-3" />}
                        <span className="font-medium">{shop?.name}</span>
                        <span>£{average.toFixed(2)}</span>
                        <span className="text-xs opacity-70">({count}x)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Prices;

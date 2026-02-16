import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, History as HistoryIcon, Trash2, Search } from 'lucide-react';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const History = () => {
  const { purchases, deletePurchase, clearHistory } = usePurchaseHistory();
  const { shops } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPurchases = useMemo(() => {
    if (!searchQuery) return purchases;
    const query = searchQuery.toLowerCase();
    return purchases.filter(p => {
      const shop = shops.find(s => s.id === p.shop);
      return (
        p.itemName.toLowerCase().includes(query) ||
        shop?.name.toLowerCase().includes(query)
      );
    });
  }, [purchases, searchQuery, shops]);

  const totalSpent = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.totalPrice, 0);
  }, [filteredPurchases]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Purchase History</h1>
              <p className="text-muted-foreground">View all stock additions</p>
            </div>
          </div>
          {purchases.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all purchase history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All purchase records will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory}>Clear All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by item or shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary */}
        <div className="glass-card rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {filteredPurchases.length} purchase{filteredPurchases.length !== 1 ? 's' : ''} found
            </span>
            <span className="font-semibold text-lg">Total: £{totalSpent.toFixed(2)}</span>
          </div>
        </div>

        {/* Table */}
        {filteredPurchases.length === 0 ? (
          <div className="glass-card rounded-lg p-12 text-center">
            <HistoryIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No purchase history</h3>
            <p className="text-muted-foreground">
              {purchases.length === 0
                ? "Purchase records will appear here when you add stock"
                : "No purchases match your search"}
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => {
                  const shop = shops.find(s => s.id === purchase.shop);
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(purchase.purchasedAt), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.itemName}</TableCell>
                      <TableCell>{shop?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-right">{purchase.quantity}</TableCell>
                      <TableCell className="text-right">£{purchase.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        £{purchase.totalPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deletePurchase(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

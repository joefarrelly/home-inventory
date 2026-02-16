import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Category } from '@/types/inventory';
import { UnitType, Location, Shop } from '@/hooks/useSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BackupRestoreSection } from './BackupRestoreSection';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  unitTypes: UnitType[];
  locations: Location[];
  shops: Shop[];
  onAddCategory: (category: Category) => void;
  onRemoveCategory: (id: string) => void;
  onAddUnitType: (unit: UnitType) => void;
  onRemoveUnitType: (id: string) => void;
  onAddLocation: (location: Location) => void;
  onRemoveLocation: (id: string) => void;
  onAddShop: (shop: Shop) => void;
  onRemoveShop: (id: string) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  categories,
  unitTypes,
  locations,
  shops,
  onAddCategory,
  onRemoveCategory,
  onAddUnitType,
  onRemoveUnitType,
  onAddLocation,
  onRemoveLocation,
  onAddShop,
  onRemoveShop,
}: SettingsDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitSingular, setNewUnitSingular] = useState('');
  const [newUnitPlural, setNewUnitPlural] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newShopName, setNewShopName] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    onAddCategory({ id, name });
    setNewCategoryName('');
  };

  const handleAddUnitType = () => {
    if (!newUnitSingular.trim() || !newUnitPlural.trim()) return;
    const singular = newUnitSingular.trim();
    const plural = newUnitPlural.trim();
    const exists = unitTypes.some(u =>
      u.singular.toLowerCase() === singular.toLowerCase() ||
      u.plural.toLowerCase() === plural.toLowerCase()
    );
    if (exists) return;
    const id = singular.toLowerCase().replace(/\s+/g, '-');
    onAddUnitType({ id, singular, plural });
    setNewUnitSingular('');
    setNewUnitPlural('');
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const name = newLocationName.trim();
    const exists = locations.some(l => l.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    onAddLocation({ id, name });
    setNewLocationName('');
  };

  const handleAddShop = () => {
    if (!newShopName.trim()) return;
    const name = newShopName.trim();
    const exists = shops.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    onAddShop({ id, name });
    setNewShopName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="shops">Shops</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                  >
                    <span>{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="units" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Singular (e.g. Roll)"
                value={newUnitSingular}
                onChange={(e) => setNewUnitSingular(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUnitType()}
              />
              <Input
                placeholder="Plural (e.g. Rolls)"
                value={newUnitPlural}
                onChange={(e) => setNewUnitPlural(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUnitType()}
              />
              <Button onClick={handleAddUnitType} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {unitTypes.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                  >
                    <span>{unit.singular} / {unit.plural}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveUnitType(unit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Location name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <Button onClick={handleAddLocation} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                  >
                    <span>{loc.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveLocation(loc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="shops" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Shop name"
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddShop()}
              />
              <Button onClick={handleAddShop} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                  >
                    <span>{shop.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveShop(shop.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="backup" className="mt-4">
            <BackupRestoreSection />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

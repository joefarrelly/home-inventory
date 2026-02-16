export interface LocationQuantity {
  locationId: string;
  quantity: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number; // Total quantity (sum of all locations + unassigned)
  unit: string;
  minQuantity?: number;
  price?: number;
  location?: string; // Primary/default location (deprecated, kept for compatibility)
  locationQuantities?: LocationQuantity[]; // Quantities per location
  unassignedQuantity?: number; // Items not assigned to any location
  dateAdded?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
}

export const UNIT_TYPES = [
  { id: 'items', singular: 'Item', plural: 'Items' },
] as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'general', name: 'General' },
];

// Helper to get unassigned quantity from an item
export function getUnassignedQuantity(item: InventoryItem): number {
  if (item.unassignedQuantity !== undefined) {
    return item.unassignedQuantity;
  }
  // For backward compatibility: if no locationQuantities, all are unassigned
  if (!item.locationQuantities || item.locationQuantities.length === 0) {
    return item.quantity;
  }
  const assignedTotal = item.locationQuantities.reduce((sum, lq) => sum + lq.quantity, 0);
  return Math.max(0, item.quantity - assignedTotal);
}

// Helper to get quantity at a specific location
export function getLocationQuantity(item: InventoryItem, locationId: string): number {
  return item.locationQuantities?.find(lq => lq.locationId === locationId)?.quantity || 0;
}

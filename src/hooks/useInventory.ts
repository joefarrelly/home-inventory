import { useState, useEffect, useCallback, useRef } from 'react';
import { InventoryItem, LocationQuantity } from '@/types/inventory';
import { fetchData, saveData } from '@/lib/api';
import { generateUUID } from '@/lib/uuid';

const STORAGE_KEY = 'home-inventory-items';
const API_ENDPOINT = '/inventory';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData<InventoryItem[]>(API_ENDPOINT, STORAGE_KEY, []);
      setItems(data.map((item: InventoryItem) => ({
        ...item,
        unit: item.unit || 'items',
        locationQuantities: item.locationQuantities || [],
        unassignedQuantity: item.unassignedQuantity ?? item.quantity,
        dateAdded: item.dateAdded ? new Date(item.dateAdded) : undefined,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save whenever items change
  useEffect(() => {
    if (!isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(API_ENDPOINT, STORAGE_KEY, items);
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [items, isLoading]);

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: generateUUID(),
      locationQuantities: [],
      unassignedQuantity: item.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date() }
        : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const incrementQuantity = useCallback((id: string, amount: number = 1) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? {
            ...item,
            quantity: item.quantity + amount,
            unassignedQuantity: (item.unassignedQuantity ?? item.quantity) + amount,
            updatedAt: new Date()
          }
        : item
    ));
  }, []);

  const decrementQuantity = useCallback((id: string, amount: number = 1, locationId: string | null = null) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      let newUnassigned = item.unassignedQuantity ?? 0;
      let newLocationQuantities = [...(item.locationQuantities || [])];
      let actualRemoved = 0;

      if (locationId === null) {
        // Remove from unassigned
        const removeAmount = Math.min(amount, newUnassigned);
        newUnassigned -= removeAmount;
        actualRemoved = removeAmount;
      } else {
        // Remove from specific location
        const locIdx = newLocationQuantities.findIndex(lq => lq.locationId === locationId);
        if (locIdx >= 0) {
          const removeAmount = Math.min(amount, newLocationQuantities[locIdx].quantity);
          newLocationQuantities[locIdx] = {
            ...newLocationQuantities[locIdx],
            quantity: newLocationQuantities[locIdx].quantity - removeAmount,
          };
          actualRemoved = removeAmount;
          // Remove empty locations
          newLocationQuantities = newLocationQuantities.filter(lq => lq.quantity > 0);
        }
      }

      return {
        ...item,
        quantity: Math.max(0, item.quantity - actualRemoved),
        unassignedQuantity: newUnassigned,
        locationQuantities: newLocationQuantities,
        updatedAt: new Date()
      };
    }));
  }, []);

  const moveToLocation = useCallback((id: string, toLocationId: string, amount: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const unassigned = item.unassignedQuantity ?? item.quantity;
      const moveAmount = Math.min(amount, unassigned);

      if (moveAmount <= 0) return item;

      const newLocationQuantities = [...(item.locationQuantities || [])];
      const existingIdx = newLocationQuantities.findIndex(lq => lq.locationId === toLocationId);

      if (existingIdx >= 0) {
        newLocationQuantities[existingIdx] = {
          ...newLocationQuantities[existingIdx],
          quantity: newLocationQuantities[existingIdx].quantity + moveAmount,
        };
      } else {
        newLocationQuantities.push({ locationId: toLocationId, quantity: moveAmount });
      }

      return {
        ...item,
        unassignedQuantity: unassigned - moveAmount,
        locationQuantities: newLocationQuantities,
        updatedAt: new Date(),
      };
    }));
  }, []);

  const moveBetweenLocations = useCallback((
    id: string,
    fromLocationId: string | null,
    toLocationId: string,
    amount: number
  ) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      let newUnassigned = item.unassignedQuantity ?? 0;
      let newLocationQuantities = [...(item.locationQuantities || [])];

      // Reduce from source
      if (fromLocationId === null) {
        // From unassigned
        const moveAmount = Math.min(amount, newUnassigned);
        if (moveAmount <= 0) return item;
        newUnassigned -= moveAmount;

        // Add to destination
        const existingIdx = newLocationQuantities.findIndex(lq => lq.locationId === toLocationId);
        if (existingIdx >= 0) {
          newLocationQuantities[existingIdx] = {
            ...newLocationQuantities[existingIdx],
            quantity: newLocationQuantities[existingIdx].quantity + moveAmount,
          };
        } else {
          newLocationQuantities.push({ locationId: toLocationId, quantity: moveAmount });
        }
      } else {
        // From a location
        const fromIdx = newLocationQuantities.findIndex(lq => lq.locationId === fromLocationId);
        if (fromIdx < 0) return item;

        const moveAmount = Math.min(amount, newLocationQuantities[fromIdx].quantity);
        if (moveAmount <= 0) return item;

        newLocationQuantities[fromIdx] = {
          ...newLocationQuantities[fromIdx],
          quantity: newLocationQuantities[fromIdx].quantity - moveAmount,
        };

        if (toLocationId === '') {
          // Move to unassigned
          newUnassigned += moveAmount;
        } else {
          // Move to another location
          const toIdx = newLocationQuantities.findIndex(lq => lq.locationId === toLocationId);
          if (toIdx >= 0) {
            newLocationQuantities[toIdx] = {
              ...newLocationQuantities[toIdx],
              quantity: newLocationQuantities[toIdx].quantity + moveAmount,
            };
          } else {
            newLocationQuantities.push({ locationId: toLocationId, quantity: moveAmount });
          }
        }

        // Remove empty locations
        newLocationQuantities = newLocationQuantities.filter(lq => lq.quantity > 0);
      }

      return {
        ...item,
        unassignedQuantity: newUnassigned,
        locationQuantities: newLocationQuantities,
        updatedAt: new Date(),
      };
    }));
  }, []);

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    incrementQuantity,
    decrementQuantity,
    moveToLocation,
    moveBetweenLocations,
  };
}

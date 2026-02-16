import { useState, useEffect, useCallback, useRef } from 'react';
import { PurchaseLog } from '@/types/purchaseLog';
import { fetchData, saveData } from '@/lib/api';
import { generateUUID } from '@/lib/uuid';

const STORAGE_KEY = 'home-inventory-purchase-history';
const API_ENDPOINT = '/purchases';

export function usePurchaseHistory() {
  const [purchases, setPurchases] = useState<PurchaseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData<PurchaseLog[]>(API_ENDPOINT, STORAGE_KEY, []);
      setPurchases(data.map((p: PurchaseLog) => ({
        ...p,
        purchasedAt: new Date(p.purchasedAt),
      })));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save whenever purchases change
  useEffect(() => {
    if (!isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(API_ENDPOINT, STORAGE_KEY, purchases);
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [purchases, isLoading]);

  const addPurchase = useCallback((purchase: Omit<PurchaseLog, 'id' | 'purchasedAt'>) => {
    const newPurchase: PurchaseLog = {
      ...purchase,
      id: generateUUID(),
      purchasedAt: new Date(),
    };
    setPurchases(prev => [newPurchase, ...prev]);
    return newPurchase;
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setPurchases([]);
  }, []);

  return {
    purchases,
    isLoading,
    addPurchase,
    deletePurchase,
    clearHistory,
  };
}

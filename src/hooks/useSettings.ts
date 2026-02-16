import { useState, useEffect, useCallback, useRef } from 'react';
import { Category, DEFAULT_CATEGORIES, UNIT_TYPES } from '@/types/inventory';
import { fetchData, saveData } from '@/lib/api';

const STORAGE_KEY = 'home-inventory-settings';
const API_ENDPOINT = '/settings';

export interface UnitType {
  id: string;
  singular: string;
  plural: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
}

interface Settings {
  categories: Category[];
  unitTypes: UnitType[];
  locations: Location[];
  shops: Shop[];
}

const DEFAULT_LOCATIONS: Location[] = [
  { id: 'home', name: 'Home' },
];

const DEFAULT_SHOPS: Shop[] = [
  { id: 'shop', name: 'Shop' },
];

const DEFAULT_SETTINGS: Settings = {
  categories: DEFAULT_CATEGORIES,
  unitTypes: [...UNIT_TYPES],
  locations: DEFAULT_LOCATIONS,
  shops: DEFAULT_SHOPS,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData<Settings | null>(API_ENDPOINT, STORAGE_KEY, null);
      if (data) {
        setSettings({
          categories: data.categories || DEFAULT_CATEGORIES,
          unitTypes: data.unitTypes || [...UNIT_TYPES],
          locations: data.locations || DEFAULT_LOCATIONS,
          shops: data.shops || DEFAULT_SHOPS,
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save whenever settings change
  useEffect(() => {
    if (!isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(API_ENDPOINT, STORAGE_KEY, settings);
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [settings, isLoading]);

  const addCategory = useCallback((category: Category) => {
    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  const addUnitType = useCallback((unit: UnitType) => {
    setSettings(prev => ({
      ...prev,
      unitTypes: [...prev.unitTypes, unit],
    }));
  }, []);

  const removeUnitType = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      unitTypes: prev.unitTypes.filter(u => u.id !== id),
    }));
  }, []);

  const addLocation = useCallback((location: Location) => {
    setSettings(prev => ({
      ...prev,
      locations: [...prev.locations, location],
    }));
  }, []);

  const removeLocation = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l.id !== id),
    }));
  }, []);

  const addShop = useCallback((shop: Shop) => {
    setSettings(prev => ({
      ...prev,
      shops: [...prev.shops, shop],
    }));
  }, []);

  const removeShop = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      shops: prev.shops.filter(s => s.id !== id),
    }));
  }, []);

  return {
    ...settings,
    isLoading,
    addCategory,
    removeCategory,
    addUnitType,
    removeUnitType,
    addLocation,
    removeLocation,
    addShop,
    removeShop,
  };
}

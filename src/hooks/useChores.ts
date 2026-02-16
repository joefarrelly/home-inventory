import { useState, useEffect, useCallback, useRef } from 'react';
import { Chore } from '@/types/chore';
import { fetchData, saveData } from '@/lib/api';
import { generateUUID } from '@/lib/uuid';

const STORAGE_KEY = 'home-inventory-chores';
const API_ENDPOINT = '/chores';

export function useChores() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData<Chore[]>(API_ENDPOINT, STORAGE_KEY, []);
      setChores(data.map((chore: Chore) => ({
        ...chore,
        createdAt: new Date(chore.createdAt),
        updatedAt: new Date(chore.updatedAt),
      })));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save whenever chores change
  useEffect(() => {
    if (!isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(API_ENDPOINT, STORAGE_KEY, chores);
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [chores, isLoading]);

  const addChore = useCallback((chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newChore: Chore = {
      ...chore,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChores(prev => [...prev, newChore]);
    return newChore;
  }, []);

  const updateChore = useCallback((id: string, updates: Partial<Chore>) => {
    setChores(prev => prev.map(chore =>
      chore.id === id
        ? { ...chore, ...updates, updatedAt: new Date() }
        : chore
    ));
  }, []);

  const deleteChore = useCallback((id: string) => {
    setChores(prev => prev.filter(chore => chore.id !== id));
  }, []);

  return {
    chores,
    isLoading,
    addChore,
    updateChore,
    deleteChore,
  };
}

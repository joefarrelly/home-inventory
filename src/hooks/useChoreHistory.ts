import { useState, useEffect, useCallback, useRef } from 'react';
import { ChoreCompletion } from '@/types/chore';
import { fetchData, saveData } from '@/lib/api';
import { generateUUID } from '@/lib/uuid';

const STORAGE_KEY = 'home-inventory-chore-history';
const API_ENDPOINT = '/chore-history';

export function useChoreHistory() {
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData<ChoreCompletion[]>(API_ENDPOINT, STORAGE_KEY, []);
      setCompletions(data.map((c: ChoreCompletion) => ({
        ...c,
        completedAt: new Date(c.completedAt),
      })));
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save whenever completions change
  useEffect(() => {
    if (!isLoading) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData(API_ENDPOINT, STORAGE_KEY, completions);
      }, 300);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [completions, isLoading]);

  const addCompletion = useCallback((choreId: string, choreName: string, notes?: string) => {
    const newCompletion: ChoreCompletion = {
      id: generateUUID(),
      choreId,
      choreName,
      completedAt: new Date(),
      notes,
    };
    setCompletions(prev => [newCompletion, ...prev]);
    return newCompletion;
  }, []);

  const deleteCompletion = useCallback((id: string) => {
    setCompletions(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setCompletions([]);
  }, []);

  return {
    completions,
    isLoading,
    addCompletion,
    deleteCompletion,
    clearHistory,
  };
}

import { fetchData, saveData } from './api';

interface BackupData {
  version: 1;
  exportedAt: string;
  inventory: unknown;
  purchases: unknown;
  settings: unknown;
  chores: unknown;
  choreHistory: unknown;
}

const STORES = [
  { endpoint: '/inventory', key: 'home-inventory-items', field: 'inventory' },
  { endpoint: '/purchases', key: 'home-inventory-purchase-history', field: 'purchases' },
  { endpoint: '/settings', key: 'home-inventory-settings', field: 'settings' },
  { endpoint: '/chores', key: 'home-inventory-chores', field: 'chores' },
  { endpoint: '/chore-history', key: 'home-inventory-chore-history', field: 'choreHistory' },
] as const;

export async function exportBackup(): Promise<BackupData> {
  const data: Record<string, unknown> = {};
  for (const store of STORES) {
    data[store.field] = await fetchData(store.endpoint, store.key, null);
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  } as BackupData;
}

export async function importBackup(backup: BackupData): Promise<void> {
  for (const store of STORES) {
    const value = backup[store.field as keyof BackupData];
    if (value !== undefined) {
      await saveData(store.endpoint, store.key, value);
    }
  }
}

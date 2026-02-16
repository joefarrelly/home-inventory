// API client for file-based storage
// In development, uses localStorage as fallback
// In production (HA addon), uses the Express API

const isDev = import.meta.env.DEV;

// Get the base URL for API calls
// In HA addon with ingress, we need to use relative URLs
const getApiBase = () => {
  return '/api';
};

export async function fetchData<T>(endpoint: string, fallbackKey: string, defaultValue: T): Promise<T> {
  // In development, try API first, fallback to localStorage
  if (isDev) {
    try {
      const response = await fetch(`${getApiBase()}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        if (data !== null) return data;
      }
    } catch {
      // API not available, use localStorage
    }

    const stored = localStorage.getItem(fallbackKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid JSON
      }
    }
    return defaultValue;
  }

  // In production, always use API
  try {
    const response = await fetch(`${getApiBase()}${endpoint}`);
    if (response.ok) {
      const data = await response.json();
      if (data !== null) return data;
    }
  } catch (e) {
    console.error(`Error fetching ${endpoint}:`, e);
  }
  return defaultValue;
}

export async function saveData<T>(endpoint: string, fallbackKey: string, data: T): Promise<void> {
  // In development, save to both API (if available) and localStorage
  if (isDev) {
    localStorage.setItem(fallbackKey, JSON.stringify(data));
    try {
      await fetch(`${getApiBase()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // API not available, localStorage save is sufficient
    }
    return;
  }

  // In production, save to API
  try {
    await fetch(`${getApiBase()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.error(`Error saving to ${endpoint}:`, e);
  }
}

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Data directory - uses /config in HA addon (mapped via addon_config), local folder for development
// Check if running in HA environment (container with /config mounted)
const getDataDir = () => {
  // First check env var
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  // Check if /config exists (HA addon environment)
  if (existsSync('/config')) {
    return '/config';
  }
  // Fallback to local data folder for development
  return join(__dirname, '..', 'data');
};
const DATA_DIR = getDataDir();

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get file path
const getFilePath = (name) => join(DATA_DIR, `${name}.json`);

// Helper to read data
const readData = (name, defaultValue = null) => {
  const filePath = getFilePath(name);
  if (existsSync(filePath)) {
    try {
      return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`Error reading ${name}:`, e);
    }
  }
  return defaultValue;
};

// Helper to compare arrays and find changes
const findChanges = (oldArr = [], newArr = [], nameKey = 'name') => {
  const oldIds = new Set(oldArr.map(item => item.id));
  const newIds = new Set(newArr.map(item => item.id));

  const added = newArr.filter(item => !oldIds.has(item.id));
  const removed = oldArr.filter(item => !newIds.has(item.id));

  return { added, removed };
};

// Helper to write data
const writeData = (name, data) => {
  const filePath = getFilePath(name);
  try {
    // Read existing data to compare
    const oldData = readData(name, null);

    writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Log what changed
    if (name === 'settings' && data) {
      const changes = [];

      if (oldData) {
        // Check categories
        const catChanges = findChanges(oldData.categories, data.categories);
        catChanges.added.forEach(c => changes.push(`added category "${c.name}"`));
        catChanges.removed.forEach(c => changes.push(`removed category "${c.name}"`));

        // Check locations
        const locChanges = findChanges(oldData.locations, data.locations);
        locChanges.added.forEach(l => changes.push(`added location "${l.name}"`));
        locChanges.removed.forEach(l => changes.push(`removed location "${l.name}"`));

        // Check shops
        const shopChanges = findChanges(oldData.shops, data.shops);
        shopChanges.added.forEach(s => changes.push(`added shop "${s.name}"`));
        shopChanges.removed.forEach(s => changes.push(`removed shop "${s.name}"`));

        // Check unit types
        const unitChanges = findChanges(oldData.unitTypes, data.unitTypes, 'singular');
        unitChanges.added.forEach(u => changes.push(`added unit type "${u.singular}"`));
        unitChanges.removed.forEach(u => changes.push(`removed unit type "${u.singular}"`));
      }

      if (changes.length > 0) {
        console.log(`Settings: ${changes.join(', ')}`);
      } else if (!oldData) {
        console.log(`Settings: initial save`);
      }

    } else if (name === 'inventory' && Array.isArray(data)) {
      const oldItems = oldData || [];
      const changes = findChanges(oldItems, data);
      const msgs = [];

      changes.added.forEach(item => msgs.push(`added "${item.name}"`));
      changes.removed.forEach(item => msgs.push(`removed "${item.name}"`));

      // Check for quantity changes
      if (oldItems.length > 0) {
        data.forEach(newItem => {
          const oldItem = oldItems.find(o => o.id === newItem.id);
          if (oldItem && oldItem.quantity !== newItem.quantity) {
            const diff = newItem.quantity - oldItem.quantity;
            if (diff > 0) {
              msgs.push(`"${newItem.name}" +${diff} (now ${newItem.quantity})`);
            } else {
              msgs.push(`"${newItem.name}" ${diff} (now ${newItem.quantity})`);
            }
          }
        });
      }

      if (msgs.length > 0) {
        console.log(`Inventory: ${msgs.join(', ')}`);
      }

    } else if (name === 'purchases' && Array.isArray(data)) {
      const oldPurchases = oldData || [];
      const changes = findChanges(oldPurchases, data, 'itemName');

      changes.added.forEach(p => {
        console.log(`Purchase: ${p.quantity}x "${p.itemName}" @ £${p.unitPrice.toFixed(2)} each (£${p.totalPrice.toFixed(2)} total)`);
      });

    } else {
      console.log(`Saved ${name}`);
    }
  } catch (e) {
    console.error(`Error writing ${name} to ${filePath}:`, e);
  }
};

// API Routes

// Inventory
app.get('/api/inventory', (req, res) => {
  const items = readData('inventory', []);
  res.json(items);
});

app.post('/api/inventory', (req, res) => {
  const items = req.body;
  writeData('inventory', items);
  res.json({ success: true });
});

// Purchase History
app.get('/api/purchases', (req, res) => {
  const purchases = readData('purchases', []);
  res.json(purchases);
});

app.post('/api/purchases', (req, res) => {
  const purchases = req.body;
  writeData('purchases', purchases);
  res.json({ success: true });
});

// Chores
app.get('/api/chores', (req, res) => {
  const chores = readData('chores', []);
  res.json(chores);
});

app.post('/api/chores', (req, res) => {
  const chores = req.body;
  writeData('chores', chores);
  res.json({ success: true });
});

// Chore History
app.get('/api/chore-history', (req, res) => {
  const history = readData('chore-history', []);
  res.json(history);
});

app.post('/api/chore-history', (req, res) => {
  const history = req.body;
  writeData('chore-history', history);
  res.json({ success: true });
});

// Settings
app.get('/api/settings', (req, res) => {
  const settings = readData('settings', null);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const settings = req.body;
  writeData('settings', settings);
  res.json({ success: true });
});

// Export full backup as JSON
app.get('/api/export-backup', (req, res) => {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory: readData('inventory', []),
    purchases: readData('purchases', []),
    settings: readData('settings', null),
    chores: readData('chores', []),
    choreHistory: readData('chore-history', []),
  };
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="home-inventory-backup-${date}.json"`);
  res.send(JSON.stringify(backup, null, 2));
});

// Export inventory as CSV
app.get('/api/export-csv', (req, res) => {
  const items = readData('inventory', []);
  const settings = readData('settings', null);
  const unitTypes = settings?.unitTypes || [];

  const escapeCsv = (val) => {
    if (typeof val !== 'string') return String(val);
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const header = 'Name,Quantity,Unit';
  const sorted = [...items].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
  const rows = sorted.map(item => {
    const unitType = unitTypes.find(u => u.id === item.unit);
    const unitName = unitType ? (item.quantity === 1 ? unitType.singular : unitType.plural) : (item.unit || '');
    return `${escapeCsv(item.name)},${item.quantity},${escapeCsv(unitName)}`;
  });
  const csv = [header, ...rows].join('\n');

  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-${date}.csv"`);
  res.send(csv);
});

// Serve APK download
app.get('/download/app.apk', (req, res) => {
  const apkPath = join(DATA_DIR, 'app.apk');
  if (existsSync(apkPath)) {
    res.download(apkPath, 'HomeInventory.apk');
  } else {
    res.status(404).json({ error: 'APK not available' });
  }
});

app.get('/api/apk-available', (req, res) => {
  const apkPath = join(DATA_DIR, 'app.apk');
  res.json({ available: existsSync(apkPath) });
});

// Serve static files from the built React app
const distPath = join(__dirname, '..', 'dist');
console.log(`Dist path: ${distPath}`);
console.log(`Dist exists: ${existsSync(distPath)}`);
if (existsSync(distPath)) {
  const { readdirSync } = await import('fs');
  console.log(`Dist contents: ${readdirSync(distPath).join(', ')}`);
}
app.use(express.static(distPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Home Inventory server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Data directory exists: ${existsSync(DATA_DIR)}`);
  // List files in data directory
  try {
    const files = readdirSync(DATA_DIR);
    console.log(`Data directory contents: ${files.length ? files.join(', ') : '(empty)'}`);
  } catch (e) {
    console.log(`Could not list data directory: ${e.message}`);
  }
});

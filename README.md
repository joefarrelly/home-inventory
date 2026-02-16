# Home Inventory

A household inventory management app for tracking items, stock levels, purchase history, and prices. Built with React and deployable as a Home Assistant add-on.

## Features

- **Inventory tracking** -- add items with categories, locations, and stock levels
- **Stock management** -- add/remove stock with quantity and price tracking
- **Purchase history** -- log of all stock changes with date and shop info
- **Price comparison** -- track prices across shops over time
- **Dashboard** -- overview stats and insights
- **Chores** -- household task tracking
- **Backup/restore** -- export and import your data
- **Home Assistant** -- deploy as an HA add-on with persistent storage

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router DOM
- Express.js (optional backend)
- localStorage for data persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev          # Vite dev server only
npm run dev:full     # Vite + Express backend
```

### Build

```bash
npm run build        # Production build
npm run preview      # Preview the production build
```

## Home Assistant Deployment

1. `npm run build:addon`
2. Copy `deploy/home-inventory` to `\\<HA-IP>\addons\` (replace existing)
3. In HA: Settings > Add-ons > Home Inventory > **Rebuild** > **Start**
4. Check logs to verify startup

Data persists in `/addon_configs/local_home-inventory/` on HA.

## Project Structure

```
src/
  components/
    inventory/    # Inventory-specific components
    ui/           # shadcn/ui base components
  hooks/          # Custom hooks (useInventory, usePurchaseHistory, useSettings)
  pages/          # Route pages (Index, History, Prices, Dashboard, Chores)
  types/          # TypeScript type definitions
  lib/            # Utility functions
server/           # Express backend
```

## License

[MIT](LICENSE)

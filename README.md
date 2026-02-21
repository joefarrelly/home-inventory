# Home Inventory

A household inventory management app for tracking items, stock levels, purchase history, and chores. Built with React and deployable as a Home Assistant add-on. Primarily used as a native Android app.

## Features

- **Inventory tracking** — add items with categories, locations, and units
- **Stock management** — add/remove stock with quantity and price tracking
- **Low stock alerts** — items at 1 unit remaining are flagged automatically
- **Purchase history** — log of all stock changes with date and shop info
- **Price comparison** — track prices across shops over time
- **Chores** — household task tracking with scheduling and completion history
- **Dashboard** — overview of low stock items and overdue/upcoming chores
- **Backup/restore** — export and import your data as JSON
- **Android APK** — native Android wrapper via Capacitor
- **Home Assistant** — deploy as an HA add-on with persistent storage

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router DOM
- Express.js backend
- Capacitor (Android)

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
    chores/       # Chores-specific components
    ui/           # shadcn/ui base components
  hooks/          # Custom hooks (useInventory, usePurchaseHistory, useSettings, useChores)
  pages/          # Route pages (Dashboard, Index, History, Prices, Chores)
  types/          # TypeScript type definitions
  lib/            # Utility functions
server/           # Express backend
android/          # Capacitor Android project
```

## License

[MIT](LICENSE)

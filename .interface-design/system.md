# Design System — Home Inventory App

## Direction
Dark theme, glass morphism, mobile-first inventory management UI.
Depth via borders and opacity layering — no drop shadows.

---

## Spacing

| Token   | Value | Usage                          |
|---------|-------|--------------------------------|
| `xs`    | 4px   | Tight groups (gap-1, p-1)      |
| `sm`    | 8px   | List items, dense (gap-2, p-2) |
| `md`    | 12px  | Compact cards (gap-3, p-3)     |
| `lg`    | 16px  | Primary cards (gap-4, p-4)     |
| `xl`    | 24px  | Section spacing (gap-6, p-6)   |
| `2xl`   | 32px  | Large page padding (p-8)       |

**Primary unit:** 16px (p-4) for cards and containers.

---

## Radius

| Token    | Value    | Class          | Usage                    |
|----------|----------|----------------|--------------------------|
| `md`     | 9px      | `rounded-md`   | Medium elements, tabs    |
| `lg`     | 12px     | `rounded-lg`   | Cards, dialogs (primary) |
| `xl`     | 16px     | `rounded-xl`   | Large feature cards      |
| `full`   | 9999px   | `rounded-full` | Pills, status indicators |

**Default:** `rounded-lg` (12px).

---

## Colors (HSL)

### Core
| Role         | HSL               | Usage                     |
|--------------|-------------------|---------------------------|
| Background   | `222 47% 11%`     | Page background           |
| Foreground   | `210 40% 98%`     | Primary text              |
| Card         | `222 47% 11%`     | Card background           |
| Border       | `217 33% 22%`     | Borders                   |
| Primary      | `199 89% 48%`     | Actions, links            |
| Secondary    | `217 33% 22%`     | Muted backgrounds         |
| Muted FG     | `215 20% 65%`     | Secondary text            |
| Destructive  | `0 72% 51%`       | Errors, delete actions    |

### Status
| State    | Color        | BG opacity | Border opacity |
|----------|-------------|------------|----------------|
| Success  | green-500   | `/20`      | `/30`          |
| Warning  | amber-500   | `/20`      | `/30`          |
| Overdue  | red-500     | `/10`      | `/30`          |
| Error    | destructive | `/5`       | `/30`          |

### Opacity scale
Use fractional opacity for subtle layering: `/50`, `/30`, `/20`, `/10`, `/5`.

---

## Typography

| Role       | Classes                              | Size  |
|------------|--------------------------------------|-------|
| Page title | `text-2xl md:text-3xl font-bold tracking-tight` | 24-30px |
| Section    | `text-lg md:text-xl font-semibold`   | 18-20px |
| Card title | `text-base font-medium`              | 16px  |
| Body       | `text-sm font-medium`                | 14px  |
| Label      | `text-xs font-medium`                | 12px  |
| Caption    | `text-xs text-muted-foreground`      | 12px  |
| Stat value | `text-2xl font-bold`                 | 24px  |

**Font:** Inter (Google Fonts).
**Default weight:** `font-medium`.

---

## Depth

**Strategy:** Borders + glass blur. No box-shadows on cards.

| Layer          | Technique                                    |
|----------------|----------------------------------------------|
| Glass card     | `bg-card/80 backdrop-blur-sm border border-border/50` |
| Subtle surface | `bg-secondary/50`                            |
| Very subtle    | `bg-secondary/30`                            |
| Overlay        | `bg-background/50`                           |
| Focus ring     | `ring-2 ring-primary`                        |

Shadows reserved for: install prompt (`shadow-lg`), search input (`shadow-sm`).

---

## Patterns

### Card
```
glass-card rounded-lg p-4           /* Standard */
glass-card rounded-lg p-3           /* Compact */
glass-card rounded-lg p-4 animate-fade-in  /* Animated entry */
bg-secondary/50 rounded-lg p-3     /* Stats/summary */
```

### Button
| Variant      | Pattern                                    |
|--------------|--------------------------------------------|
| Icon         | `variant="ghost" size="icon"` → `h-8 w-8` |
| Pill filter  | `px-4 py-2 rounded-full`                  |
| Icon + text  | `<Icon className="w-4 h-4 mr-2" /> Label` |
| Destructive  | `variant="destructive"`                    |
| Primary      | Default `<Button>`                         |
| Outline      | `variant="outline"`                        |

**Circular action buttons:** `w-8 h-8 rounded-full` for +/- stock controls.

### Dialog
```tsx
<DialogContent className="sm:max-w-md">
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
  </DialogHeader>
  <div className="space-y-4 py-4">
    {/* Form content */}
  </div>
  <DialogFooter>
    <Button>Action</Button>
  </DialogFooter>
</DialogContent>
```
- Standard: `sm:max-w-md` (28rem)
- Large: `sm:max-w-lg` (32rem)
- Scrollable: `max-h-[85vh] overflow-y-auto`

### Page layout
```tsx
<div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
  <div className="max-w-6xl mx-auto space-y-4">
    {/* Page content */}
  </div>
</div>
```

### Form field
```tsx
<div className="space-y-2">
  <Label>Field name</Label>
  <Input />
</div>
```
Group fields with `space-y-4`.

---

## Icons

**Library:** Lucide React (100%).

| Size         | Classes        | Usage                     |
|--------------|----------------|---------------------------|
| Small        | `w-3 h-3`     | Decorative, inline        |
| Default      | `w-4 h-4`     | Buttons, labels (primary) |
| Medium       | `w-5 h-5`     | Standalone, nav           |
| Large        | `w-6 h-6`     | Feature icons             |
| Empty state  | `w-12 h-12`   | Placeholder illustrations |
| Dot          | `w-1.5 h-1.5` | Calendar indicators       |

**In buttons:** `<Icon className="w-4 h-4 mr-2" />` before text.

---

## Responsive

| Breakpoint | Padding      | Usage               |
|------------|-------------|----------------------|
| Default    | `p-4`       | Mobile               |
| `md:`      | `p-6`       | Tablet               |
| `lg:`      | `p-8`       | Desktop              |

Dialogs use `sm:max-w-*` for responsive width.
Grids shift from 2-col to 4-col at `md:` breakpoint.

---

## Animation

| Class              | Usage               |
|--------------------|----------------------|
| `animate-fade-in`  | Card entry animation |

Defined as custom Tailwind animation in config.

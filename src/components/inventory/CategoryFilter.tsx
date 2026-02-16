import { Category } from '@/types/inventory';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  itemCounts: Record<string, number>;
  categories: Category[];
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  itemCounts,
  categories,
}: CategoryFilterProps) {
  const totalItems = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
          selectedCategory === null
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        All ({totalItems})
      </button>
      {categories.map((category) => {
        const count = itemCounts[category.id] || 0;
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category.name} ({count})
          </button>
        );
      })}
    </div>
  );
}

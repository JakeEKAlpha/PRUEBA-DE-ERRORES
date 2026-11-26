import React from 'react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  onSelect?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className={`min-w-0 ${className}`}>
      <ol className="flex items-center flex-wrap gap-1 text-sm text-neutral-600 dark:text-neutral-400">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.id} className="inline-flex items-center gap-1 min-w-0">
              {idx > 0 && (
                <span className="material-symbols-outlined text-[15px] text-neutral-400 dark:text-neutral-600" aria-hidden="true">
                  chevron_right
                </span>
              )}
              {isLast || !item.onSelect ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate max-w-[180px] sm:max-w-[260px] ${
                    isLast ? 'font-semibold text-neutral-900 dark:text-neutral-100' : ''
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onSelect}
                  aria-label={`Abrir ${item.label}`}
                  className="truncate max-w-[150px] hover:text-[#1B6B37] dark:hover:text-[#5ce28a] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#308C50] rounded px-1 py-0.5 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

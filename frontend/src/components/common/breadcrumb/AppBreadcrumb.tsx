'use client';

import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  active?: boolean;
};

type AppBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function AppBreadcrumb({ items, className = '' }: AppBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-gray-500 ${className}`}>
      <ol className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && <span className="text-gray-400 select-none">›</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-[#1b4360] transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-gray-800' : ''}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

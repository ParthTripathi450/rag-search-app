'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Search' },
  { href: '/documents', label: 'Documents' },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <nav className="mb-8 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative py-4 px-1 text-sm font-medium transition-colors
                  ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                {item.label}

                {/* Active underline */}
                <span
                  className={`absolute inset-x-0 bottom-0 h-0.5 transition-colors
                    ${
                      active
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-transparent'
                    }`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

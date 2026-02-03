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
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl h-16 px-6 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg">
            ✨
          </div>
          RAG Search
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative text-sm font-medium transition-colors ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-4 left-0 right-0 h-0.5 ${
                    active ? 'bg-blue-600' : 'bg-transparent'
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

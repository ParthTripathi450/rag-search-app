'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Search' },
  { href: '/documents', label: 'Documents' },
  { href: '/scrape', label: 'Scrape Website' }, // ✅ NEW
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 font-semibold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg">
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
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}

                {/* Active underline */}
                <span
                  className={`absolute -bottom-4 left-0 right-0 h-0.5 transition-colors ${
                    active ? 'bg-primary' : 'bg-transparent'
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

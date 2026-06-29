'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, BarChart3, Newspaper, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutGrid },
  { href: '/market', label: 'Market', icon: BarChart3 },
  { href: '/news', label: 'Berita', icon: Newspaper },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-line bg-bg-primary/80 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

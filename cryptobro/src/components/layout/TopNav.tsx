'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/market', label: 'Market' },
  { href: '/news', label: 'Berita' },
  { href: '/profile', label: 'Profil' },
] as const;

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border-line bg-bg-primary/80 backdrop-blur-xl md:flex">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-xl font-bold text-accent">
          CryptoBro
        </Link>

        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

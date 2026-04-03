'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin/orgs',     label: 'Организации' },
  { href: '/admin/couriers', label: 'Курьеры' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-card border-b border-border px-6 flex gap-1 transition-colors">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            pathname.startsWith(tab.href)
              ? 'border-accent text-text'
              : 'border-transparent text-subtle hover:text-text'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

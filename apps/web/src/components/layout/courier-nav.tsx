'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Package, History } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/locale';

export function CourierNav() {
  const pathname = usePathname();
  const t = useLocaleStore(s => s.t);

  const TABS = [
    { href: '/courier/dashboard', label: t.courierNav.shift,   Icon: Clock },
    { href: '/courier/orders',    label: t.courierNav.orders,  Icon: Package },
    { href: '/courier/history',   label: t.courierNav.history, Icon: History },
  ];

  return (
    <nav className="bg-card border-b border-border px-4 flex gap-0.5 transition-colors">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              active
                ? 'border-accent text-text'
                : 'border-transparent text-subtle hover:text-text hover:border-border'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

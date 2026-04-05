'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Building2, Bike, ShoppingBag, BarChart2, MessageCircle } from 'lucide-react';
import { useLocaleStore } from '@/lib/store/locale';
import { api } from '@/lib/api';
import { connectSocket, getSocket, joinAdminSupport } from '@/lib/socket';

export function AdminNav() {
  const pathname = usePathname();
  const t = useLocaleStore(s => s.t);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get<{ count: number }>('/api/support/admin/unread').then(r => setUnread(r.count)).catch(() => {});
    connectSocket();
    joinAdminSupport();
    const socket = getSocket();
    socket.on('support:notify', () => {
      if (!window.location.pathname.startsWith('/admin/support')) {
        setUnread(u => u + 1);
      }
    });
    return () => { socket.off('support:notify'); };
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/support')) setUnread(0);
  }, [pathname]);

  const TABS = [
    { href: '/admin/orgs',      label: t.adminNav.orgs,      Icon: Building2, badge: 0 },
    { href: '/admin/couriers',  label: t.adminNav.couriers,  Icon: Bike,       badge: 0 },
    { href: '/admin/orders',    label: 'Заказы',             Icon: ShoppingBag, badge: 0 },
    { href: '/admin/analytics', label: 'Аналитика',          Icon: BarChart2,   badge: 0 },
    { href: '/admin/support',   label: 'Поддержка',          Icon: MessageCircle, badge: unread },
  ];

  return (
    <nav className="hidden sm:flex bg-card border-b border-border px-4 gap-0.5 transition-colors">
      {TABS.map(({ href, label, Icon, badge }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
              active
                ? 'border-accent text-text'
                : 'border-transparent text-subtle hover:text-text hover:border-border'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            {label}
            {badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

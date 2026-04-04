'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Package, History, LayoutDashboard, ClipboardList, UtensilsCrossed, Building2, Bike, ShoppingBag, BarChart2, Store, ShoppingCart } from 'lucide-react';

const ROLE_TABS = {
  courier: [
    { href: '/courier/dashboard', label: 'Смена',   Icon: Clock },
    { href: '/courier/orders',    label: 'Заказы',  Icon: Package },
    { href: '/courier/history',   label: 'История', Icon: History },
  ],
  owner: [
    { href: '/owner/dashboard', label: 'Главная', Icon: LayoutDashboard },
    { href: '/owner/orders',    label: 'Заказы',  Icon: ClipboardList },
    { href: '/owner/menu',      label: 'Меню',    Icon: UtensilsCrossed },
  ],
  admin: [
    { href: '/admin/orgs',      label: 'Орги',      Icon: Building2 },
    { href: '/admin/couriers',  label: 'Курьеры',   Icon: Bike },
    { href: '/admin/orders',    label: 'Заказы',    Icon: ShoppingBag },
    { href: '/admin/analytics', label: 'Аналитика', Icon: BarChart2 },
  ],
  customer: [
    { href: '/customer/catalog', label: 'Каталог', Icon: Store },
    { href: '/customer/cart',    label: 'Корзина', Icon: ShoppingCart },
    { href: '/customer/orders',  label: 'Заказы',  Icon: ClipboardList },
  ],
} as const;

type Role = keyof typeof ROLE_TABS;

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = ROLE_TABS[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] justify-center transition-colors ${
                active ? 'text-accent' : 'text-subtle'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

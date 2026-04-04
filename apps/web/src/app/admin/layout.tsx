import { TopNav } from '@/components/layout/top-nav';
import { AdminNav } from '@/components/layout/admin-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Building2, Bike, ShoppingBag, BarChart2 } from 'lucide-react';

const TABS = [
  { href: '/admin/orgs',      label: 'Орги',      Icon: Building2 },
  { href: '/admin/couriers',  label: 'Курьеры',   Icon: Bike },
  { href: '/admin/orders',    label: 'Заказы',    Icon: ShoppingBag },
  { href: '/admin/analytics', label: 'Аналитика', Icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <AdminNav />
      <div className="pb-20 sm:pb-0">
        {children}
      </div>
      <BottomNav tabs={TABS} />
    </div>
  );
}

import { TopNav } from '@/components/layout/top-nav';
import { OwnerNav } from '@/components/layout/owner-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { LayoutDashboard, ClipboardList, UtensilsCrossed } from 'lucide-react';

const TABS = [
  { href: '/owner/dashboard', label: 'Главная', Icon: LayoutDashboard },
  { href: '/owner/orders',    label: 'Заказы',  Icon: ClipboardList },
  { href: '/owner/menu',      label: 'Меню',    Icon: UtensilsCrossed },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <OwnerNav />
      <div className="pb-20 sm:pb-0">
        {children}
      </div>
      <BottomNav tabs={TABS} />
    </div>
  );
}

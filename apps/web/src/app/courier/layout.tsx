import { TopNav } from '@/components/layout/top-nav';
import { CourierNav } from '@/components/layout/courier-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Clock, Package, History } from 'lucide-react';

const TABS = [
  { href: '/courier/dashboard', label: 'Смена',   Icon: Clock },
  { href: '/courier/orders',    label: 'Заказы',  Icon: Package },
  { href: '/courier/history',   label: 'История', Icon: History },
];

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <CourierNav />
      <div className="pb-20 sm:pb-0">
        {children}
      </div>
      <BottomNav tabs={TABS} />
    </div>
  );
}

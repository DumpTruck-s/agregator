import { TopNav } from '@/components/layout/top-nav';
import { CartFab } from '@/components/customer/cart-fab';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <div className="pb-20 sm:pb-0">{children}</div>
      <CartFab />
      <BottomNav role="customer" />
    </div>
  );
}

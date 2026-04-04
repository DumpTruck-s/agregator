import { TopNav } from '@/components/layout/top-nav';
import { CartFab } from '@/components/customer/cart-fab';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      {children}
      <CartFab />
    </div>
  );
}

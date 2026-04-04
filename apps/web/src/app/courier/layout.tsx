import { TopNav } from '@/components/layout/top-nav';
import { CourierNav } from '@/components/layout/courier-nav';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <CourierNav />
      <div className="pb-20 sm:pb-0">{children}</div>
      <BottomNav role="courier" />
    </div>
  );
}

import { TopNav } from '@/components/layout/top-nav';
import { OwnerNav } from '@/components/layout/owner-nav';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <OwnerNav />
      <div className="pb-20 sm:pb-0">{children}</div>
      <BottomNav role="owner" />
    </div>
  );
}

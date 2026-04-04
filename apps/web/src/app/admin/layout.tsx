import { TopNav } from '@/components/layout/top-nav';
import { AdminNav } from '@/components/layout/admin-nav';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <AdminNav />
      <div className="pb-20 sm:pb-0">{children}</div>
      <BottomNav role="admin" />
    </div>
  );
}

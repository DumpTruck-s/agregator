import { TopNav } from '@/components/layout/top-nav';
import { AdminNav } from '@/components/layout/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <AdminNav />
      {children}
    </div>
  );
}

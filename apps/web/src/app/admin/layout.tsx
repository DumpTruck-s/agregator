import { TopNav } from '@/components/layout/top-nav';
import { AdminNav } from '@/components/layout/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <AdminNav />
      {children}
    </div>
  );
}

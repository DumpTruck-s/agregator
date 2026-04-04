import { TopNav } from '@/components/layout/top-nav';
import { OwnerNav } from '@/components/layout/owner-nav';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <OwnerNav />
      {children}
    </div>
  );
}

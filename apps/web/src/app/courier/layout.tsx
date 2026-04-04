import { TopNav } from '@/components/layout/top-nav';
import { CourierNav } from '@/components/layout/courier-nav';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <CourierNav />
      {children}
    </div>
  );
}

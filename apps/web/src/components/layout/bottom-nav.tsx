'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export function BottomNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] justify-center transition-colors ${
                active ? 'text-accent' : 'text-subtle'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

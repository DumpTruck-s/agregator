'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Utensils, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocaleStore } from '@/lib/store/locale';

interface Org { id: string; name: string; description?: string; logo?: string }

function OrgSkeleton() {
  return (
    <div className="border border-border bg-card rounded-2xl p-5 animate-pulse">
      <div className="w-12 h-12 bg-muted rounded-xl mb-3" />
      <div className="h-4 bg-muted rounded-lg w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded-lg w-full" />
    </div>
  );
}

export default function CatalogPage() {
  const [orgs, setOrgs]       = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const t = useLocaleStore(s => s.t);

  useEffect(() => {
    api.get<Org[]>('/api/orgs')
      .then(setOrgs)
      .catch(() => setError(t.catalog.loadError))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold text-text mb-6">{t.catalog.title}</h1>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <OrgSkeleton key={i} />)
          : orgs.length === 0
            ? (
              <div className="col-span-3 text-center py-20 text-subtle">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-7 h-7 text-subtle" strokeWidth={1.5} />
                </div>
                <p className="font-medium">{t.catalog.empty}</p>
              </div>
            )
            : orgs.map((org, i) => (
              <Link
                key={org.id}
                href={`/customer/org/${org.id}`}
                className="group border border-border bg-card rounded-2xl p-5 hover:shadow-theme-md hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up flex flex-col"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden shrink-0">
                  {org.logo
                    ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                    : <Utensils className="w-6 h-6 text-subtle" strokeWidth={1.5} />
                  }
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-text">{org.name}</h2>
                  {org.description && (
                    <p className="text-sm text-subtle mt-1 line-clamp-2">{org.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs font-semibold">{t.catalog.open}</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
              </Link>
            ))
        }
      </div>
    </div>
  );
}

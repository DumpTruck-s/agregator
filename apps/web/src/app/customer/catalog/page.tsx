'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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

  useEffect(() => {
    api.get<Org[]>('/api/orgs')
      .then(setOrgs)
      .catch(() => setError('Не удалось загрузить рестораны'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Рестораны</h1>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <OrgSkeleton key={i} />)
          : orgs.length === 0
            ? (
              <div className="col-span-3 text-center py-20 text-subtle">
                <p className="text-5xl mb-3">🍽️</p>
                <p className="font-medium">Нет доступных ресторанов</p>
              </div>
            )
            : orgs.map((org, i) => (
              <Link
                key={org.id}
                href={`/customer/org/${org.id}`}
                className="group border border-border bg-card rounded-2xl p-5 hover:shadow-theme-md hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {org.logo || '🍽️'}
                </div>
                <h2 className="font-semibold text-text">{org.name}</h2>
                {org.description && (
                  <p className="text-sm text-subtle mt-1 line-clamp-2">{org.description}</p>
                )}
              </Link>
            ))
        }
      </div>
    </div>
  );
}

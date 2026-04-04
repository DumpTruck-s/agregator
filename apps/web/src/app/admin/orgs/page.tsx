'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Org {
  id: string; name: string; description?: string; isVerified: boolean; isActive: boolean; createdAt: string;
  owner: { name: string; email: string; phone?: string };
}

type Filter = 'all' | 'pending' | 'inactive';

export default function AdminOrgsPage() {
  const [orgs, setOrgs]     = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api.get<Org[]>('/api/admin/orgs').then(setOrgs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function verify(id: string) {
    setActing(id);
    try { const u = await api.patch<Org>(`/api/admin/orgs/${id}/verify`, {}); setOrgs(p => p.map(o => o.id === id ? u : o)); }
    finally { setActing(null); }
  }

  async function toggleActive(org: Org) {
    setActing(org.id);
    try {
      const u = await api.patch<Org>(`/api/admin/orgs/${org.id}/${org.isActive ? 'deactivate' : 'activate'}`, {});
      setOrgs(p => p.map(o => o.id === org.id ? u : o));
    } finally { setActing(null); }
  }

  const filtered      = orgs.filter(o => filter === 'pending' ? !o.isVerified && o.isActive : filter === 'inactive' ? !o.isActive : true);
  const pendingCount  = orgs.filter(o => !o.isVerified && o.isActive).length;

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-6">Организации</h1>

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {([
          { key: 'pending',  label: `Ожидают${pendingCount ? ` (${pendingCount})` : ''}` },
          { key: 'all',      label: 'Все' },
          { key: 'inactive', label: 'Отключённые' },
        ] as { key: Filter; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === t.key ? 'bg-card shadow text-text' : 'text-subtle hover:text-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-3">✅</p>
          <p>{filter === 'pending' ? 'Нет заявок' : 'Список пуст'}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((org, i) => (
          <div key={org.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-text">{org.name}</p>
                  {!org.isActive     && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Отключён</span>}
                  {org.isVerified    && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">✓ Верифицирован</span>}
                  {!org.isVerified && org.isActive && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">Ожидает</span>}
                </div>
                {org.description && <p className="text-sm text-subtle truncate">{org.description}</p>}
                <p className="text-xs text-subtle/70 mt-1">{org.owner.name} · {org.owner.email}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!org.isVerified && org.isActive && (
                  <button onClick={() => verify(org.id)} disabled={acting === org.id}
                    className="text-xs bg-accent text-accent-fg rounded-xl px-3 py-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
                    {acting === org.id ? '...' : 'Верифицировать'}
                  </button>
                )}
                <button onClick={() => toggleActive(org)} disabled={acting === org.id}
                  className={`text-xs rounded-xl px-3 py-2 transition-all disabled:opacity-50 active:scale-95 ${org.isActive ? 'border border-border text-subtle hover:bg-muted' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {acting === org.id ? '...' : org.isActive ? 'Отключить' : 'Включить'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

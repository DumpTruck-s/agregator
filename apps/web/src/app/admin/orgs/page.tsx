'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Org {
  id: string;
  name: string;
  description?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  owner: { name: string; email: string; phone?: string };
}

type Filter = 'all' | 'pending' | 'inactive';

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    api.get<Org[]>('/api/admin/orgs')
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function verify(id: string) {
    setActing(id);
    try {
      const updated = await api.patch<Org>(`/api/admin/orgs/${id}/verify`, {});
      setOrgs(prev => prev.map(o => o.id === id ? updated : o));
    } finally { setActing(null); }
  }

  async function toggleActive(org: Org) {
    setActing(org.id);
    try {
      const path = org.isActive ? 'deactivate' : 'activate';
      const updated = await api.patch<Org>(`/api/admin/orgs/${org.id}/${path}`, {});
      setOrgs(prev => prev.map(o => o.id === org.id ? updated : o));
    } finally { setActing(null); }
  }

  const filtered = orgs.filter(o => {
    if (filter === 'pending')  return !o.isVerified && o.isActive;
    if (filter === 'inactive') return !o.isActive;
    return true;
  });

  const pendingCount  = orgs.filter(o => !o.isVerified && o.isActive).length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-6">Организации</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'pending',  label: `Ожидают${pendingCount ? ` (${pendingCount})` : ''}` },
          { key: 'all',      label: 'Все' },
          { key: 'inactive', label: 'Отключённые' },
        ] as { key: Filter; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === t.key ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>{filter === 'pending' ? 'Нет заявок на верификацию' : 'Список пуст'}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(org => (
          <div key={org.id} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{org.name}</p>
                  {!org.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Отключён</span>
                  )}
                  {org.isVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Верифицирован</span>
                  )}
                  {!org.isVerified && org.isActive && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Ожидает верификации</span>
                  )}
                </div>
                {org.description && (
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{org.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Владелец: {org.owner.name} · {org.owner.email}
                  {org.owner.phone && ` · ${org.owner.phone}`}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                {!org.isVerified && org.isActive && (
                  <button
                    onClick={() => verify(org.id)}
                    disabled={acting === org.id}
                    className="text-xs bg-black text-white rounded-lg px-3 py-2 hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {acting === org.id ? '...' : 'Верифицировать'}
                  </button>
                )}
                <button
                  onClick={() => toggleActive(org)}
                  disabled={acting === org.id}
                  className={`text-xs rounded-lg px-3 py-2 transition disabled:opacity-50 ${
                    org.isActive
                      ? 'border text-gray-600 hover:bg-gray-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
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

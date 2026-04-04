'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Shift {
  id: string;
  startedAt: string;
  deliveryRadiusKm: number;
}

interface Courier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  shifts: Shift[];
}

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  useEffect(() => {
    api.get<Courier[]>('/api/admin/couriers')
      .then(setCouriers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active  = couriers.filter(c => c.shifts.length > 0);
  const shown   = filter === 'active' ? active : couriers;

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
      <h1 className="text-xl font-bold text-text mb-6">Курьеры</h1>

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {([
          { key: 'all',    label: `Все (${couriers.length})` },
          { key: 'active', label: `На смене (${active.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === t.key ? 'bg-card shadow text-text' : 'text-subtle hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-3">🛵</p>
          <p>{filter === 'active' ? 'Нет активных курьеров' : 'Нет курьеров'}</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((courier, i) => {
          const activeShift = courier.shifts[0];
          return (
            <div key={courier.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-theme-sm hover:shadow-theme-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text">{courier.name}</p>
                  {activeShift ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      На смене
                    </span>
                  ) : (
                    <span className="text-xs bg-muted text-subtle px-2 py-0.5 rounded-full">
                      Не в смене
                    </span>
                  )}
                </div>
                <p className="text-sm text-subtle mt-0.5">
                  {courier.email}{courier.phone && ` · ${courier.phone}`}
                </p>
                {activeShift && (
                  <p className="text-xs text-subtle/70 mt-0.5">
                    Смена с {new Date(activeShift.startedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit', minute: '2-digit',
                    })} · радиус {activeShift.deliveryRadiusKm} км
                  </p>
                )}
              </div>
              <p className="text-xs text-subtle/60 shrink-0">
                С {new Date(courier.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

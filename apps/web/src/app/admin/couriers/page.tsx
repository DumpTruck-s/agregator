'use client';
import { useEffect, useState } from 'react';
import { Bike } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocaleStore } from '@/lib/store/locale';

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
  const t = useLocaleStore(s => s.t);
  const ac = t.admin.couriers;

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
      <h1 className="font-display text-2xl font-semibold text-text mb-6">{ac.title}</h1>

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
        {([
          { key: 'all',    label: `${ac.filterAll} (${couriers.length})` },
          { key: 'active', label: `${ac.filterActive} (${active.length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key ? 'bg-card shadow text-text' : 'text-subtle hover:text-text'
            }`}
          >
            {label}
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
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Bike className="w-5 h-5 text-subtle" strokeWidth={1.5} />
          </div>
          <p>{filter === 'active' ? ac.noActive : ac.none}</p>
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
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      {ac.onShift}
                    </span>
                  ) : (
                    <span className="text-xs bg-muted text-subtle px-2 py-0.5 rounded-full">
                      {ac.notOnShift}
                    </span>
                  )}
                </div>
                <p className="text-sm text-subtle mt-0.5">
                  {courier.email}{courier.phone && ` · ${courier.phone}`}
                </p>
                {activeShift && (
                  <p className="text-xs text-subtle/70 mt-0.5">
                    {ac.shiftFrom} {new Date(activeShift.startedAt).toLocaleTimeString(t.dateLocale, {
                      hour: '2-digit', minute: '2-digit',
                    })} · {ac.radius} {activeShift.deliveryRadiusKm} {t.common.km}
                  </p>
                )}
              </div>
              <p className="text-xs text-subtle/60 shrink-0">
                {ac.since} {new Date(courier.createdAt).toLocaleDateString(t.dateLocale, {
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

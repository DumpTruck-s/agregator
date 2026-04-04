'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyStat  { date: string; orders: number; revenue: number }
interface OrgStat    { id: string; name: string; orders: number; revenue: number }
interface CourierStat{ id: string; name: string; delivered: number; revenue: number }
interface Analytics {
  totals: { users: number; orgs: number; orders: number; couriers: number };
  daily: DailyStat[];
  topOrgs: OrgStat[];
  topCouriers: CourierStat[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm">
      <p className="text-sm text-subtle">{label}</p>
      <p className="text-2xl font-bold text-text mt-1">{value}</p>
      {sub && <p className="text-xs text-subtle mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Analytics>('/api/admin/analytics')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!data) return <p className="text-center text-subtle p-12">Нет данных</p>;

  const totalRevenue = data.daily.reduce((s, d) => s + d.revenue, 0);

  const fmtDate = (d: string) => {
    const [, m, day] = d.split('-');
    return `${day}.${m}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
      <h1 className="font-display text-2xl font-semibold text-text">Аналитика</h1>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Пользователей" value={data.totals.users} />
        <StatCard label="Организаций"   value={data.totals.orgs} />
        <StatCard label="Курьеров"       value={data.totals.couriers} />
        <StatCard label="Заказов всего"  value={data.totals.orders} sub={`${totalRevenue.toLocaleString('ru-RU')} ₽ выручка`} />
      </div>

      {/* Orders per day */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm">
        <h2 className="font-semibold text-text mb-4">Заказы за 30 дней</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
              labelFormatter={(d: unknown) => fmtDate(String(d))}
              formatter={(v: unknown) => [Number(v), 'заказов']}
            />
            <Area type="monotone" dataKey="orders" stroke="var(--color-accent)" fill="url(#ordersGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue per day */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm">
        <h2 className="font-semibold text-text mb-4">Выручка за 30 дней (₽)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.daily} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
              labelFormatter={(d: unknown) => fmtDate(String(d))}
              formatter={(v: unknown) => [`${Number(v).toLocaleString('ru-RU')} ₽`, 'выручка']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Top orgs */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm">
          <h2 className="font-semibold text-text mb-4">Топ ресторанов</h2>
          {data.topOrgs.length === 0 ? <p className="text-sm text-subtle">Нет данных</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.topOrgs} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: unknown) => [Number(v), 'заказов']}
                />
                <Bar dataKey="orders" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top couriers */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-theme-sm">
          <h2 className="font-semibold text-text mb-4">Топ курьеров</h2>
          {data.topCouriers.length === 0 ? <p className="text-sm text-subtle">Нет данных</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.topCouriers} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'var(--color-subtle)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: unknown) => [Number(v), 'доставок']}
                />
                <Bar dataKey="delivered" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

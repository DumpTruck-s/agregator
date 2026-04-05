'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Utensils, ChevronRight, MapPin, Navigation, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocaleStore } from '@/lib/store/locale';

interface TradePoint { id: string; lat: number; lng: number; deliveryRadiusKm: number }
interface Org { id: string; name: string; description?: string; logo?: string; tradePoints: TradePoint[] }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestDistance(org: Org, lat: number, lng: number) {
  if (!org.tradePoints.length) return Infinity;
  return Math.min(...org.tradePoints.map(tp => haversineKm(lat, lng, tp.lat, tp.lng)));
}

function estimatedMinutes(distKm: number) {
  // 30 km/h courier speed + 10 min prep
  return Math.round(distKm / 30 * 60) + 10;
}

function isInDeliveryZone(org: Org, lat: number, lng: number) {
  return org.tradePoints.some(tp => haversineKm(lat, lng, tp.lat, tp.lng) <= tp.deliveryRadiusKm);
}

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
  const [orgs, setOrgs]         = useState<Org[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [userPos, setUserPos]   = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const t = useLocaleStore(s => s.t);

  useEffect(() => {
    api.get<Org[]>('/api/orgs')
      .then(setOrgs)
      .catch(() => setError(t.catalog.loadError))
      .finally(() => setLoading(false));

    // Try silent geolocation on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, // silent fail
        { timeout: 5000 }
      );
    }
  }, []);

  function requestGeo() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
    );
  }

  const sorted = userPos
    ? [...orgs].sort((a, b) => nearestDistance(a, userPos.lat, userPos.lng) - nearestDistance(b, userPos.lat, userPos.lng))
    : orgs;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold text-text">{t.catalog.title}</h1>
        <button
          onClick={requestGeo}
          disabled={geoLoading}
          title="Определить моё местоположение"
          className={`flex items-center gap-1.5 text-sm border border-border rounded-xl px-3 py-2 transition-all active:scale-95 disabled:opacity-50 ${
            userPos ? 'bg-accent/10 text-accent border-accent/30' : 'bg-muted text-subtle hover:text-text hover:bg-border'
          }`}
        >
          <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
          {userPos ? 'Рядом со мной' : 'Моё место'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <OrgSkeleton key={i} />)
          : sorted.length === 0
            ? (
              <div className="col-span-3 text-center py-20 text-subtle">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-7 h-7 text-subtle" strokeWidth={1.5} />
                </div>
                <p className="font-medium">{t.catalog.empty}</p>
              </div>
            )
            : sorted.map((org, i) => {
              const dist = userPos ? nearestDistance(org, userPos.lat, userPos.lng) : null;
              const inZone = userPos ? isInDeliveryZone(org, userPos.lat, userPos.lng) : null;
              const mins = dist !== null && dist < Infinity ? estimatedMinutes(dist) : null;

              return (
                <Link
                  key={org.id}
                  href={`/customer/org/${org.id}`}
                  className="group border border-border bg-card rounded-2xl p-5 neon-card shadow-theme-sm animate-slide-up flex flex-col"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                      {org.logo
                        ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                        : <Utensils className="w-6 h-6 text-subtle" strokeWidth={1.5} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-text leading-tight">{org.name}</h2>
                      {org.description && (
                        <p className="text-sm text-subtle mt-0.5 line-clamp-2">{org.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {dist !== null && dist < Infinity ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-subtle">
                          <MapPin className="w-3 h-3" strokeWidth={2} />
                          <span>{dist < 1 ? `${Math.round(dist * 1000)} м` : `${dist.toFixed(1)} км`}</span>
                        </div>
                        {mins !== null && (
                          <div className={`flex items-center gap-1 text-xs font-medium ${inZone ? 'text-green-600 dark:text-green-400' : 'text-subtle'}`}>
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            <span>{inZone ? `~${mins} мин` : 'Вне зоны'}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-xs font-semibold">{t.catalog.open}</span>
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              );
            })
        }
      </div>
    </div>
  );
}

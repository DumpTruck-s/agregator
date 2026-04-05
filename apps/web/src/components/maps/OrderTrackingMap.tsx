'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Clock, Route } from 'lucide-react';
import { MAP_STYLE } from './tiles';

interface OrderTrackingMapProps {
  pickup: { lat: number; lng: number; label?: string };
  delivery: { lat: number; lng: number; label?: string };
  height?: string;
}

interface RouteInfo {
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
  distanceKm: number;
  durationMin: number;
}

async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return {
      geojson: {
        type: 'Feature',
        geometry: route.geometry,
        properties: {},
      },
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

// Straight-line fallback when OSRM is unavailable
function straightLineGeoJSON(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
    },
    properties: {},
  };
}

export function OrderTrackingMap({ pickup, delivery, height = '250px' }: OrderTrackingMapProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [fallback, setFallback]   = useState(false);
  const [popup, setPopup]         = useState<'pickup' | 'delivery' | null>(null);

  useEffect(() => {
    fetchRoute(pickup, delivery).then(info => {
      if (info) { setRouteInfo(info); setFallback(false); }
      else setFallback(true);
    });
  }, [pickup.lat, pickup.lng, delivery.lat, delivery.lng]);

  const center = {
    longitude: (pickup.lng + delivery.lng) / 2,
    latitude:  (pickup.lat + delivery.lat) / 2,
  };

  const routeData = routeInfo?.geojson ?? (fallback ? straightLineGeoJSON(pickup, delivery) : null);

  return (
    <div className="space-y-2">
      {/* Route info bar */}
      {routeInfo && (
        <div className="flex items-center gap-4 text-xs text-subtle px-1">
          <div className="flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
            <span className="font-medium text-text">{routeInfo.distanceKm} км</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
            <span className="font-medium text-text">~{routeInfo.durationMin} мин</span>
          </div>
          {fallback && <span className="text-subtle/60 italic">прямая линия</span>}
        </div>
      )}

      <div style={{ height }} className="rounded-xl overflow-hidden border border-border w-full">
        <Map
          initialViewState={{ ...center, zoom: 12 }}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Real route */}
          {routeData && (
            <Source id="route" type="geojson" data={routeData}>
              {/* Outer glow */}
              <Layer
                id="route-glow"
                type="line"
                paint={{ 'line-color': '#00E0FF', 'line-width': 6, 'line-opacity': 0.2, 'line-blur': 4 }}
              />
              {/* Main line */}
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{ 'line-color': '#00D1FF', 'line-width': 3 }}
              />
            </Source>
          )}

          {/* Pickup marker — green */}
          <Marker longitude={pickup.lng} latitude={pickup.lat} onClick={() => setPopup(p => p === 'pickup' ? null : 'pickup')}>
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-white text-xs font-bold select-none">
              А
            </div>
          </Marker>

          {/* Delivery marker — accent cyan */}
          <Marker longitude={delivery.lng} latitude={delivery.lat} onClick={() => setPopup(p => p === 'delivery' ? null : 'delivery')}>
            <div className="w-8 h-8 rounded-full bg-accent border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-accent-fg text-xs font-bold select-none">
              Б
            </div>
          </Marker>

          {popup === 'pickup' && (
            <Popup longitude={pickup.lng} latitude={pickup.lat} onClose={() => setPopup(null)} closeButton={false} offset={18}>
              <p className="text-xs font-medium max-w-[180px]">{pickup.label ?? 'Точка отправки'}</p>
            </Popup>
          )}
          {popup === 'delivery' && (
            <Popup longitude={delivery.lng} latitude={delivery.lat} onClose={() => setPopup(null)} closeButton={false} offset={18}>
              <p className="text-xs font-medium max-w-[180px]">{delivery.label ?? 'Адрес доставки'}</p>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION, MARKER_ICON_URL, MARKER_ICON_RETINA_URL, MARKER_SHADOW_URL } from './tiles';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: MARKER_ICON_URL,
  iconRetinaUrl: MARKER_ICON_RETINA_URL,
  shadowUrl: MARKER_SHADOW_URL,
});

const pickupIcon = new L.Icon({
  iconUrl: MARKER_ICON_URL,
  iconRetinaUrl: MARKER_ICON_RETINA_URL,
  shadowUrl: MARKER_SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[120deg]', // green tint
});

interface OrderTrackingMapProps {
  pickup: { lat: number; lng: number; label?: string };
  delivery: { lat: number; lng: number; label?: string };
  height?: string;
}

export function OrderTrackingMap({ pickup, delivery, height = '250px' }: OrderTrackingMapProps) {
  const center: [number, number] = [
    (pickup.lat + delivery.lat) / 2,
    (pickup.lng + delivery.lng) / 2,
  ];

  const positions: [number, number][] = [
    [pickup.lat, pickup.lng],
    [delivery.lat, delivery.lng],
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>{pickup.label ?? 'Точка отправки'}</Popup>
        </Marker>
        <Marker position={[delivery.lat, delivery.lng]}>
          <Popup>{delivery.label ?? 'Адрес доставки'}</Popup>
        </Marker>
        <Polyline positions={positions} pathOptions={{ color: '#3b82f6', dashArray: '8 6' }} />
      </MapContainer>
    </div>
  );
}

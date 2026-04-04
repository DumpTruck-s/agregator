'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
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

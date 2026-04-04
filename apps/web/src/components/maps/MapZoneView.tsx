'use client';

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Zone {
  lat: number;
  lng: number;
  radiusKm: number;
  label?: string;
}

interface MapZoneViewProps {
  zones: Zone[];
  height?: string;
}

export function MapZoneView({ zones, height = '250px' }: MapZoneViewProps) {
  const center: [number, number] = zones.length > 0
    ? [zones[0].lat, zones[0].lng]
    : [55.7558, 37.6176];

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        {zones.map((zone, i) => (
          <div key={i}>
            <Marker position={[zone.lat, zone.lng]} />
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radiusKm * 1000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  );
}

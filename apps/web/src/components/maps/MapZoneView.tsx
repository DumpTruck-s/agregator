'use client';

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION, MARKER_ICON_URL, MARKER_ICON_RETINA_URL, MARKER_SHADOW_URL } from './tiles';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: MARKER_ICON_URL,
  iconRetinaUrl: MARKER_ICON_RETINA_URL,
  shadowUrl: MARKER_SHADOW_URL,
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
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
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

'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_URL, TILE_ATTRIBUTION, MARKER_ICON_URL, MARKER_ICON_RETINA_URL, MARKER_SHADOW_URL } from './tiles';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: MARKER_ICON_URL,
  iconRetinaUrl: MARKER_ICON_RETINA_URL,
  shadowUrl: MARKER_SHADOW_URL,
});

export interface MapPoint {
  lat: number;
  lng: number;
  address?: string;
}

function ClickHandler({ onPick }: { onPick: (point: MapPoint) => void }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': 'ru' } }
        );
        const data = await res.json();
        if (data.display_name) address = data.display_name;
      } catch {}
      onPick({ lat, lng, address });
    },
  });
  return null;
}

interface MapPickerProps {
  value?: MapPoint | null;
  onChange: (point: MapPoint) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function MapPicker({
  value,
  onChange,
  center = [55.7558, 37.6176],
  zoom = 12,
  height = '300px',
}: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (value && mapRef.current) {
      mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom());
    }
  }, [value?.lat, value?.lng]);

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickHandler onPick={onChange} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}

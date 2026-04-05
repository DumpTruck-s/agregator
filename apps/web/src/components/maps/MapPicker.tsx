'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, X, Loader2 } from 'lucide-react';
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

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
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

function FlyTo({ point }: { point: MapPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 1 });
  }, [point?.lat, point?.lng]);
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
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'ru' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {}
      finally { setSearching(false); }
    }, 500);
  }, []);

  function pickResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange({ lat, lng, address: r.display_name });
    setQuery(r.display_name);
    setResults([]);
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-2 border border-border bg-muted rounded-xl px-3 py-2">
          {searching
            ? <Loader2 className="w-4 h-4 text-subtle shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-subtle shrink-0" strokeWidth={2} />
          }
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value); }}
            placeholder="Поиск по адресу или городу..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-subtle/60 focus:outline-none"
          />
          {query && (
            <button onClick={clearSearch} className="text-subtle hover:text-text transition-colors">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="absolute z-[1000] top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-theme-md overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => pickResult(r)}
                className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-muted transition-colors border-b border-border last:border-0 truncate"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickHandler onPick={p => { onChange(p); setQuery(p.address ?? ''); setResults([]); }} />
          <FlyTo point={value ?? null} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>
    </div>
  );
}

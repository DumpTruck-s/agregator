'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Map, { Marker, NavigationControl, type MapRef, type MapMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { MAP_STYLE } from './tiles';

export interface MapPoint {
  lat: number;
  lng: number;
  address?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

function photonAddress(p: PhotonFeature['properties']): string {
  const parts = [
    p.name,
    p.street && p.housenumber ? `${p.street}, ${p.housenumber}` : p.street,
    p.district,
    p.city,
    p.state,
    p.country,
  ].filter(Boolean);
  return parts.join(', ');
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=ru`);
    const data = await res.json();
    if (data.features?.[0]) return photonAddress(data.features[0].properties) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function searchPlaces(query: string): Promise<{ label: string; lat: number; lng: number }[]> {
  const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=ru&limit=6`);
  const data = await res.json();
  return (data.features ?? []).map((f: PhotonFeature) => ({
    label: photonAddress(f.properties),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  })).filter((r: { label: string }) => r.label);
}

interface MapPickerProps {
  value?: MapPoint | null;
  onChange: (point: MapPoint) => void;
  center?: [number, number]; // [lat, lng]
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
  const mapRef = useRef<MapRef>(null);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fly to new value when it changes externally
  useEffect(() => {
    if (value && mapRef.current) {
      mapRef.current.flyTo({
        center: [value.lng, value.lat],
        zoom: Math.max(mapRef.current.getZoom(), 15),
        duration: 800,
      });
    }
  }, [value?.lat, value?.lng]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { setResults(await searchPlaces(q)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, []);

  async function handleMapClick(e: MapMouseEvent) {
    const { lng, lat } = e.lngLat;
    const address = await reverseGeocode(lat, lng);
    onChange({ lat, lng, address });
    setQuery(address);
    setResults([]);
  }

  function pickResult(r: { label: string; lat: number; lng: number }) {
    onChange({ lat: r.lat, lng: r.lng, address: r.label });
    setQuery(r.label);
    setResults([]);
  }

  return (
    <div className="space-y-2">
      {/* Search */}
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
            placeholder="Поиск: улица, город, район..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-subtle/60 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="text-subtle hover:text-text transition-colors">
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="absolute z-[200] top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-theme-md overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => pickResult(r)}
                className="w-full text-left px-3 py-2.5 text-sm text-text hover:bg-muted transition-colors border-b border-border last:border-0"
              >
                <span className="line-clamp-1">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: value?.lng ?? center[1],
            latitude: value?.lat ?? center[0],
            zoom,
          }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
          cursor="crosshair"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          {value && (
            <Marker longitude={value.lng} latitude={value.lat}>
              <div className="w-8 h-8 bg-accent rounded-full border-2 border-white shadow-lg flex items-center justify-center -translate-y-4">
                <MapPin className="w-4 h-4 text-accent-fg" strokeWidth={2.5} />
              </div>
            </Marker>
          )}
        </Map>
      </div>
    </div>
  );
}

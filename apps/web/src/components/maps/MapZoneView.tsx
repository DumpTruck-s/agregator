'use client';

import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from './tiles';

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

// Build a GeoJSON polygon approximating a circle
function circleGeoJSON(lat: number, lng: number, radiusKm: number, steps = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111.32) * Math.sin(angle);
    const dLng = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}

export function MapZoneView({ zones, height = '250px' }: MapZoneViewProps) {
  const center = zones.length > 0 ? zones[0] : { lat: 55.7558, lng: 37.6176 };

  return (
    <div style={{ height }} className="w-full">
      <Map
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 11 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        interactive={false}
      >
        {zones.map((zone, i) => (
          <span key={i}>
            <Source id={`zone-${i}`} type="geojson" data={circleGeoJSON(zone.lat, zone.lng, zone.radiusKm)}>
              <Layer
                id={`zone-fill-${i}`}
                type="fill"
                paint={{ 'fill-color': '#7c3aed', 'fill-opacity': 0.12 }}
              />
              <Layer
                id={`zone-line-${i}`}
                type="line"
                paint={{ 'line-color': '#7c3aed', 'line-width': 2, 'line-opacity': 0.7 }}
              />
            </Source>
            <Marker longitude={zone.lng} latitude={zone.lat}>
              <div className="w-3 h-3 bg-accent rounded-full border-2 border-white shadow" />
            </Marker>
          </span>
        ))}
      </Map>
    </div>
  );
}

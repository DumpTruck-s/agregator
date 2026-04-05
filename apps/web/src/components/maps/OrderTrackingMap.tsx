'use client';

import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState } from 'react';
import { MAP_STYLE } from './tiles';

interface OrderTrackingMapProps {
  pickup: { lat: number; lng: number; label?: string };
  delivery: { lat: number; lng: number; label?: string };
  height?: string;
}

export function OrderTrackingMap({ pickup, delivery, height = '250px' }: OrderTrackingMapProps) {
  const [popup, setPopup] = useState<'pickup' | 'delivery' | null>(null);

  const center = {
    longitude: (pickup.lng + delivery.lng) / 2,
    latitude:  (pickup.lat + delivery.lat) / 2,
  };

  const routeGeoJSON = {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [pickup.lng, pickup.lat],
        [delivery.lng, delivery.lat],
      ],
    },
    properties: {},
  };

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border w-full">
      <Map
        initialViewState={{ ...center, zoom: 12 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Route line */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{ 'line-color': '#7c3aed', 'line-width': 3, 'line-dasharray': [2, 1.5] }}
          />
        </Source>

        {/* Pickup marker (green) */}
        <Marker longitude={pickup.lng} latitude={pickup.lat} onClick={() => setPopup('pickup')}>
          <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-white text-xs font-bold">
            А
          </div>
        </Marker>

        {/* Delivery marker (accent) */}
        <Marker longitude={delivery.lng} latitude={delivery.lat} onClick={() => setPopup('delivery')}>
          <div className="w-8 h-8 rounded-full bg-accent border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform text-accent-fg text-xs font-bold">
            Б
          </div>
        </Marker>

        {popup === 'pickup' && (
          <Popup longitude={pickup.lng} latitude={pickup.lat} onClose={() => setPopup(null)} closeButton={false} offset={16}>
            <p className="text-xs font-medium">{pickup.label ?? 'Точка отправки'}</p>
          </Popup>
        )}
        {popup === 'delivery' && (
          <Popup longitude={delivery.lng} latitude={delivery.lat} onClose={() => setPopup(null)} closeButton={false} offset={16}>
            <p className="text-xs font-medium">{delivery.label ?? 'Адрес доставки'}</p>
          </Popup>
        )}
      </Map>
    </div>
  );
}

// CartoDB Voyager — beautiful style, EU servers, CARTO company
// Used as MapLibre GL raster source (standard {z}/{x}/{y} format)
export const CARTO_TILES = [
  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
];

export const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com">CARTO</a>';

// MapLibre GL style object — no external style URL needed
export const MAP_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: 'raster' as const,
      tiles: CARTO_TILES,
      tileSize: 256,
      attribution: TILE_ATTRIBUTION,
    },
  },
  layers: [{ id: 'carto-tiles', type: 'raster' as const, source: 'carto' }],
};

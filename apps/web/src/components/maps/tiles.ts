// Esri World Street Map — US company (Esri, California), no OSM association, no API key needed
// Note: Esri tile format is {z}/{y}/{x} (y before x, no subdomains)
export const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const TILE_ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

// Leaflet marker icons hosted on jsDelivr CDN (global, fast)
export const MARKER_ICON_URL        = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png';
export const MARKER_ICON_RETINA_URL = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png';
export const MARKER_SHADOW_URL      = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png';

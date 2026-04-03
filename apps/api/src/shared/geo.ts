const EARTH_RADIUS_KM = 6371;

/** Haversine formula — возвращает расстояние в км */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Проверяет, входит ли точка доставки в радиус торговой точки */
export function isInDeliveryRadius(
  tradePointLat: number, tradePointLng: number, radiusKm: number,
  deliveryLat: number, deliveryLng: number,
): boolean {
  return distanceKm(tradePointLat, tradePointLng, deliveryLat, deliveryLng) <= radiusKm;
}

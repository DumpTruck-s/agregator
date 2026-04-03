import { prisma } from '../../shared/prisma';

export async function getActiveOrders(courierId: string) {
  return prisma.order.findMany({
    where: { courierId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
    include: { items: { include: { menuItem: true } }, org: true, tradePoint: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getHistory(courierId: string) {
  return prisma.order.findMany({
    where: { courierId, status: { in: ['DELIVERED', 'CANCELLED'] } },
    include: { org: true },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

export async function getAvailableOrders(lat: number, lng: number, radiusKm: number) {
  // Простой BBOX-фильтр, потом уточняем Haversine
  const delta = radiusKm / 111;
  return prisma.order.findMany({
    where: {
      status: 'CREATED',
      courierId: null,
      deliveryLat: { gte: lat - delta, lte: lat + delta },
      deliveryLng: { gte: lng - delta, lte: lng + delta },
    },
    include: { org: true, tradePoint: true },
  });
}

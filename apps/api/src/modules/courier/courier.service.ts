import { prisma } from '../../shared/prisma';
import { distanceKm } from '../../shared/geo';

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

export async function getAvailableOrders(courierLat: number, courierLng: number, radiusKm: number) {
  const delta = radiusKm / 111;
  const orders = await prisma.order.findMany({
    where: {
      status: 'CREATED',
      courierId: null,
      tradePoint: {
        lat: { gte: courierLat - delta, lte: courierLat + delta },
        lng: { gte: courierLng - delta, lte: courierLng + delta },
      },
    },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      // Адрес и координаты доставки НЕ возвращаем до принятия
      org:        { select: { id: true, name: true, logo: true } },
      tradePoint: { select: { id: true, address: true, lat: true, lng: true } },
      items:      { select: { quantity: true, menuItem: { select: { name: true } } } },
    },
  });

  // Добавляем расстояние от курьера до торговой точки
  return orders.map(o => ({
    ...o,
    distanceKm: Math.round(distanceKm(courierLat, courierLng, o.tradePoint.lat, o.tradePoint.lng) * 10) / 10,
  }));
}

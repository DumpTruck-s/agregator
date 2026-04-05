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

export async function getCourierStats(courierId: string) {
  const [deliveredAgg, cancelledCount, ratingAgg, leaderboard] = await Promise.all([
    prisma.order.aggregate({
      where: { courierId, status: 'DELIVERED' },
      _count: { id: true },
      _sum:   { totalPrice: true },
    }),
    prisma.order.count({ where: { courierId, status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { courierId, status: 'DELIVERED', courierRating: { not: null } },
      _avg:   { courierRating: true },
      _count: { courierRating: true },
    }),
    // Leaderboard: rank by avg rating (min 3 rated orders), then by delivered count
    prisma.order.groupBy({
      by: ['courierId'],
      where: { status: 'DELIVERED', courierId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const delivered    = deliveredAgg._count.id;
  const cancelled    = cancelledCount;
  const earnings     = deliveredAgg._sum.totalPrice ?? 0;
  const ratingCount  = ratingAgg._count.courierRating;
  const rating       = ratingCount < 3 ? null : Math.round((ratingAgg._avg.courierRating ?? 0) * 10) / 10;

  const rankIdx       = leaderboard.findIndex(c => c.courierId === courierId);
  const rank          = rankIdx >= 0 ? rankIdx + 1 : leaderboard.length + 1;
  const totalCouriers = leaderboard.length;

  return { delivered, cancelled, earnings, rating, ratingCount, rank, totalCouriers };
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

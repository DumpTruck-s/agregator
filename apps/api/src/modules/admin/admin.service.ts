import { prisma } from '../../shared/prisma';
import { NotFoundError } from '../../shared/errors';

export async function listAllOrgs() {
  return prisma.organization.findMany({
    include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function verifyOrg(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization');
  return prisma.organization.update({ where: { id }, data: { isVerified: true } });
}

export async function deactivateOrg(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization');
  return prisma.organization.update({ where: { id }, data: { isActive: false } });
}

export async function activateOrg(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) throw new NotFoundError('Organization');
  return prisma.organization.update({ where: { id }, data: { isActive: true } });
}

export async function listCouriers() {
  return prisma.user.findMany({
    where: { role: 'COURIER' },
    select: {
      id: true, name: true, email: true, phone: true, isBlocked: true, createdAt: true,
      shifts: {
        where: { isActive: true },
        select: { id: true, startedAt: true, deliveryRadiusKm: true, deliveryZoneLat: true, deliveryZoneLng: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function blockCourier(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'COURIER') throw new NotFoundError('Courier');
  // End active shift if any
  await prisma.courierShift.updateMany({ where: { courierId: id, isActive: true }, data: { isActive: false, endedAt: new Date() } });
  return prisma.user.update({ where: { id }, data: { isBlocked: true }, select: { id: true, isBlocked: true } });
}

export async function unblockCourier(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'COURIER') throw new NotFoundError('Courier');
  return prisma.user.update({ where: { id }, data: { isBlocked: false }, select: { id: true, isBlocked: true } });
}

export async function listAllOrders() {
  return prisma.order.findMany({
    include: {
      customer: { select: { id: true, name: true, email: true } },
      courier:  { select: { id: true, name: true } },
      org:      { select: { id: true, name: true } },
      items:    { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export async function getAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalOrgs,
    totalOrders,
    totalCouriers,
    recentOrders,
    topOrgs,
    topCouriers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'COURIER' } }),

    // Orders per day for the last 30 days
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPrice: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Top 5 orgs by order count
    prisma.order.groupBy({
      by: ['orgId'],
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),

    // Top 5 couriers by delivered orders
    prisma.order.groupBy({
      by: ['courierId'],
      where: { status: 'DELIVERED', courierId: { not: null } },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  // Build daily stats map
  const dailyMap: Record<string, { date: string; orders: number; revenue: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { date: key, orders: 0, revenue: 0 };
  }
  for (const o of recentOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].orders++;
      if (o.status === 'DELIVERED') dailyMap[key].revenue += o.totalPrice;
    }
  }

  // Enrich topOrgs with names
  const orgIds = topOrgs.map(o => o.orgId);
  const orgNames = await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } });
  const orgNameMap = Object.fromEntries(orgNames.map(o => [o.id, o.name]));

  // Enrich topCouriers with names
  const courierIds = topCouriers.map(c => c.courierId).filter(Boolean) as string[];
  const courierNames = await prisma.user.findMany({ where: { id: { in: courierIds } }, select: { id: true, name: true } });
  const courierNameMap = Object.fromEntries(courierNames.map(c => [c.id, c.name]));

  return {
    totals: { users: totalUsers, orgs: totalOrgs, orders: totalOrders, couriers: totalCouriers },
    daily: Object.values(dailyMap),
    topOrgs: topOrgs.map(o => ({
      id: o.orgId,
      name: orgNameMap[o.orgId] ?? 'Unknown',
      orders: o._count.id,
      revenue: o._sum.totalPrice ?? 0,
    })),
    topCouriers: topCouriers.map(c => ({
      id: c.courierId!,
      name: courierNameMap[c.courierId!] ?? 'Unknown',
      delivered: c._count.id,
      revenue: c._sum.totalPrice ?? 0,
    })),
  };
}

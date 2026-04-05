import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { emitOrderUpdate, emitNewOrder } from '../../shared/socket';
import { isInDeliveryRadius } from '../../shared/geo';
import { assertTransition } from './order.state';
import type { CreateOrderDto, UpdateOrderStatusDto, OrderStatus, Role } from '@delivery/shared';

export async function createOrder(customerId: string, dto: CreateOrderDto) {
  const tradePoint = await prisma.tradePoint.findUnique({ where: { id: dto.tradePointId } });
  if (!tradePoint) throw new NotFoundError('TradePoint');

  const inRadius = isInDeliveryRadius(
    tradePoint.lat, tradePoint.lng, tradePoint.deliveryRadiusKm,
    dto.deliveryLat, dto.deliveryLng,
  );
  if (!inRadius) throw new ForbiddenError('Delivery address out of range');

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: dto.items.map(i => i.menuItemId) }, isAvailable: true },
  });

  const totalPrice = dto.items.reduce((sum, item) => {
    const found = menuItems.find(m => m.id === item.menuItemId);
    return sum + (found?.price ?? 0) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerId,
      orgId: dto.orgId,
      tradePointId: dto.tradePointId,
      deliveryAddress: dto.deliveryAddress,
      deliveryLat: dto.deliveryLat,
      deliveryLng: dto.deliveryLng,
      totalPrice,
      items: {
        create: dto.items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          price: menuItems.find(m => m.id === i.menuItemId)!.price,
        })),
      },
    },
    include: { items: true },
  });

  // Notify couriers in zone (simplified: zone = tradePointId)
  emitNewOrder(tradePoint.id, order);
  return order;
}

export async function updateStatus(
  orderId: string,
  dto: UpdateOrderStatusDto,
  userId: string,
  role: Role,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');

  assertTransition(order.status as OrderStatus, dto.status as OrderStatus, role);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: dto.status,
      courierId: dto.status === 'ACCEPTED' ? userId : undefined,
    },
  });

  emitOrderUpdate(orderId, updated);
  return updated;
}

export async function getMyOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: { items: { include: { menuItem: true } }, org: true, tradePoint: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function rateOrder(orderId: string, customerId: string, rating: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  if (order.customerId !== customerId) throw new ForbiddenError('Not your order');
  if (order.status !== 'DELIVERED') throw new ForbiddenError('Order not delivered yet');
  if (order.courierRating !== null) throw new ForbiddenError('Already rated');
  if (!order.courierId) throw new ForbiddenError('No courier assigned');
  if (rating < 1 || rating > 5) throw new ForbiddenError('Rating must be 1-5');

  return prisma.order.update({
    where: { id: orderId },
    data: { courierRating: rating },
  });
}

export async function getOrgOrders(ownerId: string) {
  const org = await prisma.organization.findFirst({ where: { ownerId } });
  if (!org) throw new NotFoundError('Organization');
  return prisma.order.findMany({
    where: { orgId: org.id },
    include: { items: { include: { menuItem: true } }, customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

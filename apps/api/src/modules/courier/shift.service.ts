import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import type { StartShiftDto } from '@delivery/shared';

export async function startShift(courierId: string, dto: StartShiftDto) {
  const active = await prisma.courierShift.findFirst({ where: { courierId, isActive: true } });
  if (active) throw new AppError('Shift already active', 409);
  return prisma.courierShift.create({ data: { courierId, ...dto } });
}

export async function endShift(courierId: string) {
  const shift = await prisma.courierShift.findFirst({ where: { courierId, isActive: true } });
  if (!shift) throw new AppError('No active shift', 404);
  return prisma.courierShift.update({
    where: { id: shift.id },
    data: { isActive: false, endedAt: new Date() },
  });
}

export async function getActiveShift(courierId: string) {
  return prisma.courierShift.findFirst({ where: { courierId, isActive: true } });
}

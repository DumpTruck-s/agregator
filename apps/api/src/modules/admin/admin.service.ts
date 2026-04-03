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
      id: true, name: true, email: true, phone: true, createdAt: true,
      shifts: {
        where: { isActive: true },
        select: { id: true, startedAt: true, deliveryRadiusKm: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

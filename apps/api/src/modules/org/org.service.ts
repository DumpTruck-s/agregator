import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { CreateOrgDto, CreateTradePointDto } from '@delivery/shared';

export async function createOrg(ownerId: string, dto: CreateOrgDto) {
  return prisma.organization.create({
    data: { ...dto, ownerId },
  });
}

export async function getMyOrg(ownerId: string) {
  return prisma.organization.findFirst({
    where: { ownerId },
    include: { tradePoints: true, categories: { include: { items: true } } },
  });
}

export async function listOrgs() {
  return prisma.organization.findMany({
    where: { isActive: true, isVerified: true },
    select: { id: true, name: true, description: true, logo: true },
  });
}

export async function createTradePoint(ownerId: string, orgId: string, dto: CreateTradePointDto) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.tradePoint.create({ data: { ...dto, orgId } });
}

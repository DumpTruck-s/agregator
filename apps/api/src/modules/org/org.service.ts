import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { CreateOrgDto, CreateTradePointDto } from '@delivery/shared';

export async function createOrg(ownerId: string, dto: CreateOrgDto) {
  return prisma.organization.create({ data: { ...dto, ownerId } });
}

export async function updateOrg(ownerId: string, orgId: string, dto: Partial<Pick<CreateOrgDto, 'name' | 'description'> & { logo?: string }>) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.organization.update({ where: { id: orgId }, data: dto });
}

export async function getMyOrg(ownerId: string) {
  return prisma.organization.findFirst({
    where: { ownerId },
    include: { tradePoints: true, categories: { include: { items: true } } },
  });
}

export async function getOrgById(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id, isActive: true },
    select: { id: true, name: true, description: true, logo: true, tradePoints: true },
  });
  if (!org) throw new NotFoundError('Organization');
  return org;
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

export async function deleteTradePoint(ownerId: string, tradePointId: string) {
  const tp = await prisma.tradePoint.findUnique({ where: { id: tradePointId }, include: { org: true } });
  if (!tp) throw new NotFoundError('TradePoint');
  if (tp.org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.tradePoint.delete({ where: { id: tradePointId } });
}

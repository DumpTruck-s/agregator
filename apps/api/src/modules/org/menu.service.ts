import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { CreateMenuCategoryDto, CreateMenuItemDto } from '@delivery/shared';

export async function createCategory(ownerId: string, orgId: string, dto: CreateMenuCategoryDto) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuCategory.create({ data: { ...dto, orgId } });
}

export async function createMenuItem(ownerId: string, orgId: string, dto: CreateMenuItemDto) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuItem.create({ data: dto });
}

export async function toggleItem(ownerId: string, itemId: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: { include: { org: true } } },
  });
  if (!item) throw new NotFoundError('MenuItem');
  if (item.category.org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: !item.isAvailable } });
}

export async function getOrgMenu(orgId: string) {
  return prisma.menuCategory.findMany({
    where: { orgId },
    orderBy: { sortOrder: 'asc' },
    include: { items: { where: { isAvailable: true } } },
  });
}

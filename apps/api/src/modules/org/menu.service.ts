import { prisma } from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import type { CreateMenuCategoryDto, CreateMenuItemDto } from '@delivery/shared';

async function assertItemOwner(ownerId: string, itemId: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { category: { include: { org: true } } },
  });
  if (!item) throw new NotFoundError('MenuItem');
  if (item.category.org.ownerId !== ownerId) throw new ForbiddenError();
  return item;
}

export async function createCategory(ownerId: string, orgId: string, dto: CreateMenuCategoryDto) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuCategory.create({ data: { ...dto, orgId } });
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  const cat = await prisma.menuCategory.findUnique({ where: { id: categoryId }, include: { org: true } });
  if (!cat) throw new NotFoundError('Category');
  if (cat.org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuCategory.delete({ where: { id: categoryId } });
}

export async function createMenuItem(ownerId: string, orgId: string, dto: CreateMenuItemDto) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError('Organization');
  if (org.ownerId !== ownerId) throw new ForbiddenError();
  return prisma.menuItem.create({ data: dto });
}

export async function updateMenuItem(
  ownerId: string,
  itemId: string,
  dto: Partial<Pick<CreateMenuItemDto, 'name' | 'description' | 'price' | 'image'>>,
) {
  await assertItemOwner(ownerId, itemId);
  return prisma.menuItem.update({ where: { id: itemId }, data: dto });
}

export async function deleteMenuItem(ownerId: string, itemId: string) {
  await assertItemOwner(ownerId, itemId);
  return prisma.menuItem.delete({ where: { id: itemId } });
}

export async function toggleItem(ownerId: string, itemId: string) {
  const item = await assertItemOwner(ownerId, itemId);
  return prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable: !item.isAvailable } });
}

export async function getOrgMenu(orgId: string) {
  return prisma.menuCategory.findMany({
    where: { orgId },
    orderBy: { sortOrder: 'asc' },
    include: { items: { where: { isAvailable: true } } },
  });
}

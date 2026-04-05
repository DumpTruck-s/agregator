import { prisma } from '../../shared/prisma';
import { emitSupportMessage, emitSupportNotify } from '../../shared/socket';

export async function getUserMessages(userId: string) {
  // Mark admin → user messages as read
  await prisma.supportMessage.updateMany({
    where: { userId, fromAdmin: true, isRead: false },
    data: { isRead: true },
  });
  return prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function sendUserMessage(userId: string, text: string) {
  const msg = await prisma.supportMessage.create({
    data: { userId, fromAdmin: false, text },
    include: { user: { select: { id: true, name: true, role: true } } },
  });
  emitSupportMessage(userId, msg);
  emitSupportNotify(msg); // notify admin panel
  return msg;
}

export async function getAdminChats() {
  const groups = await prisma.supportMessage.groupBy({
    by: ['userId'],
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: 'desc' } },
  });

  if (!groups.length) return [];

  const userIds = groups.map(g => g.userId);

  const [users, unreadCounts, lastMessages] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true, phone: true },
    }),
    prisma.supportMessage.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, fromAdmin: false, isRead: false },
      _count: { id: true },
    }),
    Promise.all(
      userIds.map(uid =>
        prisma.supportMessage.findFirst({
          where: { userId: uid },
          orderBy: { createdAt: 'desc' },
        })
      )
    ),
  ]);

  const userMap   = new Map(users.map(u => [u.id, u]));
  const unreadMap = new Map(unreadCounts.map(c => [c.userId, c._count.id]));

  return groups.map((g, i) => ({
    user:        userMap.get(g.userId)!,
    lastMessage: lastMessages[i]!,
    unread:      unreadMap.get(g.userId) ?? 0,
  }));
}

export async function getAdminChat(userId: string) {
  // Mark user → admin messages as read
  await prisma.supportMessage.updateMany({
    where: { userId, fromAdmin: false, isRead: false },
    data: { isRead: true },
  });
  return prisma.supportMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function sendAdminMessage(userId: string, text: string, adminId: string) {
  const msg = await prisma.supportMessage.create({
    data: { userId, fromAdmin: true, text, isRead: false },
  });
  emitSupportMessage(userId, msg);
  return msg;
}

export async function getTotalUnread() {
  const result = await prisma.supportMessage.count({
    where: { fromAdmin: false, isRead: false },
  });
  return result;
}

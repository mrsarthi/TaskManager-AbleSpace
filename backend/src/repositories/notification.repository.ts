import { prisma } from '../config/database';
import { Notification } from '@prisma/client';

/**
 * Notification Repository
 * Handles all database operations related to notifications
 */
export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(data: { message: string; userId: string; taskId?: string; assignedById?: string }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find notifications for a user
   */
  async findByUserId(userId: string, includeRead = false): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    // Ensure the notification belongs to the user before marking as read
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) {
      throw new Error('Notification not found');
    }
    return prisma.notification.update({
      where: { id: notif.id },
      data: { read: true },
      include: {
        task: { select: { id: true, title: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}


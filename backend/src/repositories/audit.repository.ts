import { prisma } from '../config/database';
import { AuditLog } from '@prisma/client';

/**
 * Audit Repository
 * Handles all database operations related to audit logs
 */
export class AuditRepository {
  /**
   * Create an audit log entry
   */
  async create(data: {
    action: string;
    taskId: string;
    userId: string;
    oldValue?: string | null;
    newValue?: string | null;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Find audit logs for a task
   */
  async findByTaskId(taskId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}


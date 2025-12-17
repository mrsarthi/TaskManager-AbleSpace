import { prisma } from '../config/database';
import { Task, Prisma, Priority } from '@prisma/client';

export interface TaskFilters {
  status?: string;
  priority?: Priority; // ✅ Now this will work!
  creatorId?: string;
  assignedToId?: string;
  overdue?: boolean;
}

export interface TaskSortOptions {
  sortBy?: 'dueDate' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export class TaskRepository {
  async create(data: {
    title: string;
    description: string;
    dueDate: Date;
    priority: Priority; // ✅ Using the real Enum
    status: string;
    creatorId: string;
    assignedToId?: string | null;
  }): Promise<Task> {
    return prisma.task.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findMany(filters: TaskFilters, sortOptions: TaskSortOptions = {}): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;

    if (filters.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'Completed' };
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    const sortBy = sortOptions.sortBy || 'dueDate';
    const sortOrder = sortOptions.sortOrder || 'asc';

    if (sortBy === 'priority') {
      orderBy.priority = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    return prisma.task.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      priority?: Priority;
      status?: string;
      assignedToId?: string | null;
    }
  ): Promise<Task> {
    return prisma.task.update({
      where: { id },
      // Casting prevents the "null vs undefined" error
      data: data as Prisma.TaskUpdateInput,
      include: {
        creator: { select: { id: true, email: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}
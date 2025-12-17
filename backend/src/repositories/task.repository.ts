import { prisma } from '../config/database';
import { Task, Prisma } from '@prisma/client';

export interface TaskFilters {
  status?: string;
  priority?: string;
  creatorId?: string;
  assignedToId?: string;
  overdue?: boolean;
}

export interface TaskSortOptions {
  sortBy?: 'dueDate' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task Repository
 * Handles all database operations related to tasks
 */
export class TaskRepository {
  /**
   * Create a new task
   */
  async create(data: {
    title: string;
    description: string;
    dueDate: Date;
    priority: string;
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
        creator: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Find tasks with filters and sorting
   */
  async findMany(filters: TaskFilters, sortOptions: TaskSortOptions = {}): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.overdue) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        not: 'Completed',
      };
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    const sortBy = sortOptions.sortBy || 'dueDate';
    const sortOrder = sortOptions.sortOrder || 'asc';

    if (sortBy === 'priority') {
      // Custom ordering for priority enum
      orderBy.priority = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    return prisma.task.findMany({
      where,
      orderBy,
      include: {
        creator: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Update a task
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      priority?: string;
      status?: string;
      assignedToId?: string | null;
    }
  ): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        creator: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    await prisma.task.delete({
      where: { id },
    });
  }
}


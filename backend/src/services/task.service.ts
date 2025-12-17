import { TaskRepository, TaskFilters, TaskSortOptions } from '../repositories/task.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../dto/task.dto';
import { Task } from '@prisma/client';
import { TaskStatus } from '../types';
import { prisma } from '../config/database';

/**
 * Task Service
 * Handles business logic for task management
 */
export class TaskService {
  private taskRepository: TaskRepository;
  private notificationRepository: NotificationRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.notificationRepository = new NotificationRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create a new task
   * @param data - Task creation data
   * @param creatorId - ID of the user creating the task
   * @returns Created task
   */
  async createTask(data: CreateTaskDto, creatorId: string): Promise<Task> {
    // Validate assigned user exists if provided
    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!assignedUser) {
        throw new ValidationError('Assigned user not found');
      }
    }

    const task = await this.taskRepository.create({
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      status: data.status || 'ToDo',
      creatorId,
      assignedToId: data.assignedToId || null,
    });

    // Create audit log
    await this.auditRepository.create({
      action: 'TASK_CREATED',
      taskId: task.id,
      userId: creatorId,
      newValue: JSON.stringify({ title: task.title, status: task.status }),
    });

    // Send notification if task is assigned
    if (data.assignedToId && data.assignedToId !== creatorId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { name: true },
      });
      const notification = await this.notificationRepository.create({
        message: `You have been assigned to task: ${task.title} by ${assignedUser?.name || 'Someone'}`,
        userId: data.assignedToId,
        taskId: task.id,
        assignedById: creatorId,
      });

      // Emit socket notification if socket handler is available
      try {
        const { socketHandler } = await import('../index');
        socketHandler.sendNotification(data.assignedToId, notification);
      } catch (err) {
        // ignore if socket handler not available (e.g., in tests)
      }
    }

    return task;
  }

  /**
   * Get task by ID
   * @param id - Task ID
   * @returns Task
   */
  async getTaskById(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task');
    }
    return task;
  }

  /**
   * Get tasks with filters and sorting
   * @param filters - Filter options
   * @param sortOptions - Sort options
   * @returns Array of tasks
   */
  async getTasks(filters: TaskFilters, sortOptions: TaskSortOptions = {}): Promise<Task[]> {
    return this.taskRepository.findMany(filters, sortOptions);
  }

  /**
   * Update a task
   * @param id - Task ID
   * @param data - Update data
   * @param userId - ID of the user making the update
   * @returns Updated task
   */
  async updateTask(id: string, data: UpdateTaskDto, userId: string): Promise<Task> {
    const existingTask = await this.taskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundError('Task');
    }

    // Validate assigned user exists if provided
    if (data.assignedToId !== undefined) {
      if (data.assignedToId) {
        const assignedUser = await prisma.user.findUnique({
          where: { id: data.assignedToId },
        });
        if (!assignedUser) {
          throw new ValidationError('Assigned user not found');
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    const updatedTask = await this.taskRepository.update(id, updateData);

    // Create audit logs for significant changes
    if (data.status !== undefined && data.status !== existingTask.status) {
      await this.auditRepository.create({
        action: 'STATUS_CHANGED',
        taskId: id,
        userId,
        oldValue: existingTask.status,
        newValue: data.status,
      });
    }

    if (data.assignedToId !== undefined && data.assignedToId !== existingTask.assignedToId) {
      await this.auditRepository.create({
        action: 'ASSIGNMENT_CHANGED',
        taskId: id,
        userId,
        oldValue: existingTask.assignedToId || 'Unassigned',
        newValue: data.assignedToId || 'Unassigned',
      });

      // Send notification if task is assigned to a different user
      if (data.assignedToId && data.assignedToId !== existingTask.assignedToId) {
        const assignedUser = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { name: true } });
        const notification = await this.notificationRepository.create({
          message: `You have been assigned to task: ${updatedTask.title} by ${assignedUser?.name || 'Someone'}`,
          userId: data.assignedToId,
          taskId: id,
          assignedById: userId,
        });

        try {
          const { socketHandler } = await import('../index');
          socketHandler.sendNotification(data.assignedToId, notification);
        } catch (err) {
          // ignore if socket handler not available
        }
      }
    }

    if (data.priority !== undefined && data.priority !== existingTask.priority) {
      await this.auditRepository.create({
        action: 'PRIORITY_CHANGED',
        taskId: id,
        userId,
        oldValue: existingTask.priority,
        newValue: data.priority,
      });
    }

    return updatedTask;
  }

  /**
   * Delete a task
   * @param id - Task ID
   * @param userId - ID of the user deleting the task
   */
  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task');
    }

    // Only creator can delete
    if (task.creatorId !== userId) {
      throw new ValidationError('Only the task creator can delete this task');
    }

    await this.taskRepository.delete(id);
  }

  /**
   * Get dashboard data for a user
   * @param userId - User ID
   * @returns Dashboard data
   */
  async getDashboard(userId: string) {
    const [assignedTasks, createdTasks, overdueTasks] = await Promise.all([
      this.taskRepository.findMany({ assignedToId: userId }),
      this.taskRepository.findMany({ creatorId: userId }),
      this.taskRepository.findMany({ assignedToId: userId, overdue: true }),
    ]);

    return {
      assignedTasks,
      createdTasks,
      overdueTasks,
    };
  }
}


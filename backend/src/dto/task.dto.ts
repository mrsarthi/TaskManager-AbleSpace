import { z } from 'zod';

/**
 * Data Transfer Objects for task endpoints
 * Using Zod for runtime validation
 */

// Enum values for validation (MySQL doesn't support native enums)
const PriorityEnum = z.enum(['Low', 'Medium', 'High', 'Urgent']);
const TaskStatusEnum = z.enum(['ToDo', 'InProgress', 'Review', 'Completed']);

export const createTaskDto = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().datetime('Invalid date format'),
  priority: PriorityEnum,
  status: TaskStatusEnum.optional().default('ToDo'),
  assignedToId: z.string().uuid('Invalid user ID').optional().nullable(),
});

export const updateTaskDto = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  priority: PriorityEnum.optional(),
  status: TaskStatusEnum.optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const taskQueryDto = z.object({
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  sortBy: z.enum(['dueDate', 'createdAt', 'priority']).optional().default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateTaskDto = z.infer<typeof createTaskDto>;
export type UpdateTaskDto = z.infer<typeof updateTaskDto>;
export type TaskQueryDto = z.infer<typeof taskQueryDto>;


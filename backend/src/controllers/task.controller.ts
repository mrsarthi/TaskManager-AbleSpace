import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { createTaskDto, updateTaskDto, taskQueryDto } from '../dto/task.dto';
import { ValidationError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

/**
 * Task Controller
 * Handles HTTP requests for task endpoints
 */
export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * POST /api/tasks
   * Create a new task
   */
  createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const validatedData = createTaskDto.parse(req.body);
      const task = await this.taskService.createTask(validatedData, req.userId);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks
   * Get tasks with filters and sorting
   */
  getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParams = taskQueryDto.parse(req.query);
      const filters: any = {};

      if (queryParams.status) filters.status = queryParams.status;
      if (queryParams.priority) filters.priority = queryParams.priority;

      const tasks = await this.taskService.getTasks(filters, {
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks/:id
   * Get a task by ID
   */
  getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this.taskService.getTaskById(req.params.id);
      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/tasks/:id
   * Update a task
   */
  updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const validatedData = updateTaskDto.parse(req.body);
      const task = await this.taskService.updateTask(req.params.id, validatedData, req.userId);

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      await this.taskService.deleteTask(req.params.id, req.userId);
      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks/dashboard
   * Get dashboard data for current user
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const dashboard = await this.taskService.getDashboard(req.userId);
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  };
}


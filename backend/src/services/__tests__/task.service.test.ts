import { TaskService } from '../task.service';
import { TaskRepository } from '../../repositories/task.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { AuditRepository } from '../../repositories/audit.repository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { TaskStatus, Priority } from '../../types';
import { prisma } from '../../config/database';

// Mock dependencies
jest.mock('../../repositories/task.repository');
jest.mock('../../repositories/notification.repository');
jest.mock('../../repositories/audit.repository');
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockAuditRepository: jest.Mocked<AuditRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService();
    mockTaskRepository = taskService['taskRepository'] as jest.Mocked<TaskRepository>;
    mockNotificationRepository = taskService['notificationRepository'] as jest.Mocked<NotificationRepository>;
    mockAuditRepository = taskService['auditRepository'] as jest.Mocked<AuditRepository>;
  });

  describe('createTask', () => {
    const mockCreateData = {
      title: 'Test Task',
      description: 'Test Description',
      dueDate: new Date().toISOString(),
      priority: Priority.High,
      status: TaskStatus.ToDo,
      assignedToId: 'user-123',
    };

    const mockCreatedTask = {
      id: 'task-123',
      ...mockCreateData,
      dueDate: new Date(mockCreateData.dueDate),
      creatorId: 'creator-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: { id: 'creator-123', email: 'creator@test.com', name: 'Creator' },
      assignedTo: { id: 'user-123', email: 'user@test.com', name: 'User' },
    };

    it('should create a task successfully when assigned user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'User',
      });
      mockTaskRepository.create.mockResolvedValue(mockCreatedTask as any);
      mockAuditRepository.create.mockResolvedValue({} as any);
      mockNotificationRepository.create.mockResolvedValue({} as any);

      const result = await taskService.createTask(mockCreateData, 'creator-123');

      expect(result).toEqual(mockCreatedTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockCreateData.title,
          description: mockCreateData.description,
          priority: mockCreateData.priority,
        })
      );
      expect(mockAuditRepository.create).toHaveBeenCalled();
      expect(mockNotificationRepository.create).toHaveBeenCalled();
    });

    it('should throw ValidationError when assigned user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(taskService.createTask(mockCreateData, 'creator-123')).rejects.toThrow(ValidationError);
      expect(mockTaskRepository.create).not.toHaveBeenCalled();
    });

    it('should create task without notification when assigned to creator', async () => {
      const dataWithoutAssignment = { ...mockCreateData, assignedToId: 'creator-123' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'creator-123',
        email: 'creator@test.com',
        name: 'Creator',
      });
      mockTaskRepository.create.mockResolvedValue({
        ...mockCreatedTask,
        assignedToId: 'creator-123',
      } as any);
      mockAuditRepository.create.mockResolvedValue({} as any);

      await taskService.createTask(dataWithoutAssignment, 'creator-123');

      expect(mockNotificationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date(),
        priority: Priority.Medium,
        status: TaskStatus.InProgress,
        creatorId: 'creator-123',
        assignedToId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaskRepository.findById.mockResolvedValue(mockTask as any);

      const result = await taskService.getTaskById('task-123');

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findById).toHaveBeenCalledWith('task-123');
    });

    it('should throw NotFoundError when task not found', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getTaskById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTask', () => {
    const mockExistingTask = {
      id: 'task-123',
      title: 'Original Title',
      description: 'Original Description',
      dueDate: new Date(),
      priority: Priority.Low,
      status: TaskStatus.ToDo,
      creatorId: 'creator-123',
      assignedToId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update task status and create audit log', async () => {
      const updateData = { status: TaskStatus.Completed };
      const updatedTask = { ...mockExistingTask, status: TaskStatus.Completed };

      mockTaskRepository.findById.mockResolvedValue(mockExistingTask as any);
      mockTaskRepository.update.mockResolvedValue(updatedTask as any);
      mockAuditRepository.create.mockResolvedValue({} as any);

      const result = await taskService.updateTask('task-123', updateData, 'user-456');

      expect(result.status).toBe(TaskStatus.Completed);
      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_CHANGED',
          taskId: 'task-123',
          oldValue: TaskStatus.ToDo,
          newValue: TaskStatus.Completed,
        })
      );
    });

    it('should throw NotFoundError when task does not exist', async () => {
      mockTaskRepository.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask('non-existent', { title: 'New Title' }, 'user-123')
      ).rejects.toThrow(NotFoundError);
    });
  });
});


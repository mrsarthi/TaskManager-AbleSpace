import { Server as HTTPServer } from 'http';
import { SocketHandler } from '../socketHandler';
import { TaskService } from '../../services/task.service';
import { NotificationRepository } from '../../repositories/notification.repository';

// Mock dependencies
jest.mock('../../services/task.service');
jest.mock('../../repositories/notification.repository');

describe('SocketHandler', () => {
  let httpServer: HTTPServer;
  let socketHandler: SocketHandler;

  beforeEach(() => {
    httpServer = new HTTPServer();
    socketHandler = new SocketHandler(httpServer);
  });

  afterEach(() => {
    httpServer.close();
  });

  it('should initialize Socket.io server', () => {
    const io = socketHandler.getIO();
    expect(io).toBeDefined();
  });

  it('should emit task update to all clients', () => {
    const mockTask = {
      id: 'task-123',
      title: 'Test Task',
      status: 'InProgress',
    };
    const mockUpdatedBy = 'user-123';

    const io = socketHandler.getIO();
    const emitSpy = jest.spyOn(io, 'emit');

    socketHandler.emitTaskUpdate(mockTask, mockUpdatedBy);

    expect(emitSpy).toHaveBeenCalledWith('task:updated', {
      task: mockTask,
      updatedBy: mockUpdatedBy,
    });
  });

  it('should send notification to specific user', () => {
    const mockNotification = {
      id: 'notif-123',
      message: 'You have been assigned to a task',
      userId: 'user-123',
    };

    const io = socketHandler.getIO();
    const toSpy = jest.fn().mockReturnValue({
      emit: jest.fn(),
    });
    jest.spyOn(io, 'to').mockImplementation(toSpy);

    socketHandler.sendNotification('user-123', mockNotification);

    expect(toSpy).toHaveBeenCalledWith('user:user-123');
  });
});


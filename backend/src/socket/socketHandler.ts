import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TaskService } from '../services/task.service';
import { NotificationRepository } from '../repositories/notification.repository';

/**
 * Socket.io Handler
 * Manages real-time communication for task updates
 */
export class SocketHandler {
  private io: SocketIOServer;
  private taskService: TaskService;
  private notificationRepository: NotificationRepository;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      },
    });

    this.taskService = new TaskService();
    this.notificationRepository = new NotificationRepository();

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware for socket connections
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || 
          socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const { verifyToken } = await import('../config/jwt');
        const payload = verifyToken(token);
        
        if (!payload) {
          return next(new Error('Authentication error: Invalid token'));
        }

        const { prisma } = await import('../config/database');
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        (socket as any).userId = user.id;
        (socket as any).user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: any) => {
      const userId = socket.userId;
      console.log(`User ${userId} connected`);

      // Join user's personal room for notifications
      socket.join(`user:${userId}`);

      // Handle task updates
      socket.on('task:update', async (data: { taskId: string; updates: any }) => {
        try {
          const updatedTask = await this.taskService.updateTask(
            data.taskId,
            data.updates,
            userId
          );

          // Broadcast update to all connected clients
          this.io.emit('task:updated', {
            task: updatedTask,
            updatedBy: userId,
          });

          // Send notification if task was assigned
          if (data.updates.assignedToId && data.updates.assignedToId !== updatedTask.assignedToId) {
            const notification = await this.notificationRepository.create({
              message: `You have been assigned to task: ${updatedTask.title} by ${socket.user.name}`,
              userId: data.updates.assignedToId,
              taskId: updatedTask.id,
              assignedById: userId,
            });

            // Send notification to specific user
            this.io.to(`user:${data.updates.assignedToId}`).emit('notification:new', notification);
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to update task' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
      });
    });
  }

  /**
   * Emit task update to all connected clients
   */
  emitTaskUpdate(task: any, updatedBy: string): void {
    this.io.emit('task:updated', {
      task,
      updatedBy,
    });
  }

  /**
   * Send notification to a specific user
   */
  sendNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Get IO instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}


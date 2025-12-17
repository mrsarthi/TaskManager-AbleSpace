import { Response, NextFunction } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';
import { ValidationError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

/**
 * Notification Controller
 * Handles HTTP requests for notification endpoints
 */
export class NotificationController {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * GET /api/notifications
   * Get notifications for current user
   */
  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const includeRead = req.query.includeRead === 'true';
      const notifications = await this.notificationRepository.findByUserId(req.userId, includeRead);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/notifications/:id/read
   * Mark a notification as read
   */
  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const notification = await this.notificationRepository.markAsRead(req.params.id, req.userId);
      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      await this.notificationRepository.markAllAsRead(req.userId);
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  };
}


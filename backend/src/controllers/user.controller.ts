import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/user.repository';

/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */
export class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * GET /api/users
   * Get all users (for task assignment dropdown)
   */
  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userRepository.findAll();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };
}
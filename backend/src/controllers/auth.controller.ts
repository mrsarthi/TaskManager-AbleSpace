import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerDto, loginDto } from '../dto/auth.dto';
import { ValidationError } from '../utils/errors';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = registerDto.parse(req.body);
      const result = await this.authService.register(validatedData);

      // Set HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Login a user
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = loginDto.parse(req.body);
      const result = await this.authService.login(validatedData);

      // Set HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Logout a user
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('token');
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  // ✅ Changed AuthenticatedRequest to Request
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }
      const user = await this.authService.getProfile(req.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  // ✅ Changed AuthenticatedRequest to Request
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        throw new ValidationError('User ID not found');
      }

      const updateData: { name?: string } = {};
      if (req.body.name) {
        updateData.name = req.body.name;
      }

      const user = await this.authService.updateProfile(req.userId, updateData);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/verify-email
   * Verify user email with token
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        throw new ValidationError('Verification token is required');
      }

      const result = await this.authService.verifyEmail(token);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/resend-verification
   * Resend verification email
   */
  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const result = await this.authService.resendVerificationEmail(email);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}
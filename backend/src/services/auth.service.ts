import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { generateToken } from '../config/jwt';
import { sendVerificationEmail } from '../config/email';

/**
 * Authentication Service
 * Handles business logic for user authentication and registration
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   * @param data - User registration data
   * @returns User object and JWT token
   */
  async register(data: RegisterDto): Promise<{ user: { id: string; email: string; name: string; emailVerified: boolean }; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: verificationTokenExpires,
    });

    // Send verification email
    try {
      await sendVerificationEmail(data.email, verificationToken, data.name);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails, but log it
    }

    // Generate token (but user needs to verify email to use full features)
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: false,
      },
      token,
    };
  }

  /**
   * Login a user
   * @param data - User login credentials
   * @returns User object and JWT token
   */
  async login(data: LoginDto): Promise<{ user: { id: string; email: string; name: string; emailVerified: boolean }; token: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedError('Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  /**
   * Get user profile
   * @param userId - User ID
   * @returns User profile
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }
    // Return with emailVerified status
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param data - Profile update data
   * @returns Updated user profile
   */
  async updateProfile(userId: string, data: { name?: string }) {
    return this.userRepository.update(userId, data);
  }

  /**
   * Verify user email
   * @param token - Email verification token
   * @returns Success message
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByVerificationToken(token);
    
    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    if (user.emailVerificationTokenExpires && user.emailVerificationTokenExpires < new Date()) {
      throw new ValidationError('Verification token has expired. Please request a new one.');
    }

    if (user.emailVerified) {
      // Return success instead of error if already verified
      return { message: 'Email is already verified' };
    }

    // Mark email as verified and clear token
    await this.userRepository.verifyEmail(user.id);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   * @param email - User email address
   * @returns Success message
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    await this.userRepository.updateVerificationToken(user.id, verificationToken, verificationTokenExpires);

    try {
      await sendVerificationEmail(user.email, verificationToken, user.name);
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new ValidationError('Failed to send verification email. Please try again later.');
    }
  }
}


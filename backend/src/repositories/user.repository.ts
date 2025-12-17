import { prisma } from '../config/database';
import { User } from '@prisma/client';

/**
 * User Repository
 * Handles all database operations related to users
 */
export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<{
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    password: string;
    name: string;
    emailVerificationToken?: string;
    emailVerificationTokenExpires?: Date;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Update user profile
   */
  async update(id: string, data: { name?: string }): Promise<{
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find all users (for task assignment)
   */
  async findAll(): Promise<Array<{ id: string; email: string; name: string }>> {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
      },
    });
  }

  /**
   * Update verification token
   */
  async updateVerificationToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: expires,
      },
    });
  }
}


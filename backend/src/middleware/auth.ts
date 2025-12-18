import { Request, Response, NextFunction } from 'express'; // Import Request
import { verifyToken } from '../config/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../config/database';
// ❌ REMOVE: import { AuthenticatedRequest } from '../types';

export async function authenticate(
  req: Request, // ✅ Change this to Request
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // ✅ These will work now because of Step 1
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
import { Socket } from 'socket.io';
import { verifyToken } from '../config/jwt';
import { prisma } from '../config/database';

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth
 */
export async function socketAuthenticate(socket: Socket, next: (err?: Error) => void): Promise<void> {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user info to socket
    (socket as any).userId = user.id;
    (socket as any).user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
}


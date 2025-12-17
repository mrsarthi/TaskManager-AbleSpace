import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a JWT token for a user
 * @param payload - User ID and email to encode in the token
 * @returns Signed JWT token string
 */
export function generateToken(payload: JWTPayload): string {
  // Casts to `any` to satisfy jsonwebtoken TypeScript overloads
  return jwt.sign(payload as any, JWT_SECRET as any, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token as any, JWT_SECRET as any) as JWTPayload;
  } catch (error) {
    return null;
  }
}


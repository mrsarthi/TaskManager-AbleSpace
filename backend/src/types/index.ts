// Enum types for TypeScript (MySQL stores as strings)
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum TaskStatus {
  ToDo = 'ToDo',
  InProgress = 'InProgress',
  Review = 'Review',
  Completed = 'Completed',
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Express.Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}


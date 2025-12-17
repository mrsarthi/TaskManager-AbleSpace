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

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  assignedToId: string | null;
  creator: User;
  assignedTo: User | null;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  userId: string;
  taskId: string | null;
  createdAt: string;
  task?: {
    id: string;
    title: string;
  };
  assignedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface DashboardData {
  assignedTasks: Task[];
  createdTasks: Task[];
  overdueTasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface CreateTaskDto {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status?: TaskStatus;
  assignedToId?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  status?: TaskStatus;
  assignedToId?: string | null;
}

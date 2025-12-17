import axios, { AxiosInstance } from 'axios';
import { User, Task, Notification, DashboardData, CreateTaskDto, UpdateTaskDto } from '../types';

/**
 * API Client
 * Handles all HTTP requests to the backend
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name: string }) {
    const response = await this.client.post<{ success: boolean; data: User }>('/auth/register', data);
    if (response.data.success && response.data.data) {
      // Store token from cookie (handled by browser)
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post<{ success: boolean; data: User }>('/auth/login', data);
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  async getProfile() {
    const response = await this.client.get<{ success: boolean; data: User }>('/auth/me');
    return response.data;
  }

  async updateProfile(data: { name?: string }) {
    const response = await this.client.put<{ success: boolean; data: User }>('/auth/profile', data);
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.client.get<{ success: boolean; message: string }>('/auth/verify-email', {
      params: { token },
    });
    return response.data;
  }

  async resendVerification(email: string) {
    const response = await this.client.post<{ success: boolean; message: string }>('/auth/resend-verification', {
      email,
    });
    return response.data;
  }

  // Task endpoints
  async createTask(data: CreateTaskDto) {
    const response = await this.client.post<{ success: boolean; data: Task }>('/tasks', data);
    return response.data;
  }

  async getTasks(params?: { status?: string; priority?: string; sortBy?: string; sortOrder?: string }) {
    const response = await this.client.get<{ success: boolean; data: Task[] }>('/tasks', { params });
    return response.data;
  }

  async getTaskById(id: string) {
    const response = await this.client.get<{ success: boolean; data: Task }>(`/tasks/${id}`);
    return response.data;
  }

  async getUsers() {
    const response = await this.client.get<{ success: boolean; data: User[] }>('/users');
    return response.data;
  }

  async updateTask(id: string, data: UpdateTaskDto) {
    const response = await this.client.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.client.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
    return response.data;
  }

  async getDashboard() {
    const response = await this.client.get<{ success: boolean; data: DashboardData }>('/tasks/dashboard');
    return response.data;
  }

  // Notification endpoints
  async getNotifications(includeRead = false) {
    const response = await this.client.get<{ success: boolean; data: Notification[] }>('/notifications', {
      params: { includeRead },
    });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.put<{ success: boolean; data: Notification }>(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.put<{ success: boolean; message: string }>('/notifications/read-all');
    return response.data;
  }
}

export const api = new ApiClient();


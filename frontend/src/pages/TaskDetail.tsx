import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';

import { mutate } from 'swr';
import { Layout } from '../components/Layout';
import { Task, TaskStatus, Priority } from '../types';
import { api } from '../lib/api';
import { socketClient } from '../lib/socket';
import { format } from 'date-fns';
import { ArrowLeft, Save, Trash2, User, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(TaskStatus),
  assignedToId: z.string().uuid().optional().nullable(),
});

type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, error: fetchError, isLoading } = useSWR<{ success: boolean; data: Task }>(
    id ? `/tasks/${id}` : null,
    () => api.getTaskById(id!)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
  });

  // Reset form when task data loads
  useEffect(() => {
    if (data?.success && data.data) {
      const task = data.data;
      reset({
        title: task.title,
        description: task.description,
        dueDate: format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm"),
        priority: task.priority,
        status: task.status,
        assignedToId: task.assignedToId || null,
      });
    }
  }, [data, reset]);

  useEffect(() => {
    if (!socketClient.isConnected()) {
      socketClient.connect();
    }

    const handleTaskUpdate = (updateData: { task: Task; updatedBy: string }) => {
      if (updateData.task.id === id) {
        mutate(`/tasks/${id}`);
      }
      mutate((key) => typeof key === 'string' && key.startsWith('/tasks'));
    };

    socketClient.on('task:updated', handleTaskUpdate);

    return () => {
      socketClient.off('task:updated', handleTaskUpdate);
    };
  }, [id]);

  const { data: usersData } = useSWR('/users', () => api.getUsers());

  const onSubmit = async (formData: UpdateTaskFormData) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Normalize empty assignedToId to null
      const payload = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        assignedToId: formData.assignedToId || null,
      } as any;

      // Optimistic update
      const optimisticTask = data?.data ? { ...data.data, ...payload } : null;
      if (optimisticTask) {
        mutate(`/tasks/${id}`, { success: true, data: optimisticTask }, false);
      }

      const response = await api.updateTask(id, payload);

      if (response.success) {
        // Revalidate
        mutate(`/tasks/${id}`);
        mutate((key) => typeof key === 'string' && key.startsWith('/tasks'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update task');
      // Revalidate on error
      mutate(`/tasks/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      setLoading(true);
      await api.deleteTask(id);
      navigate('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="card">
          <div className="skeleton h-8 w-1/3 mb-4"></div>
          <div className="skeleton h-4 w-full mb-2"></div>
          <div className="skeleton h-4 w-2/3"></div>
        </div>
      </Layout>
    );
  }

  if (fetchError || !data?.success || !data.data) {
    return (
      <Layout>
        <div className="card">
          <p className="text-red-600">Failed to load task</p>
          <Link to="/tasks" className="btn btn-secondary mt-4">
            Back to Tasks
          </Link>
        </div>
      </Layout>
    );
  }

  const task = data.data;
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const isCreator = task.creatorId === user?.id;

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <Link to="/tasks" className="btn btn-secondary inline-flex items-center mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              {...register('title')}
              type="text"
              className="input"
              placeholder="Task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="input"
              placeholder="Task description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                {...register('dueDate')}
                type="datetime-local"
                className="input"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
              {isOverdue && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  This task is overdue
                </p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select {...register('priority')} className="input">
                {Object.values(Priority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select {...register('status')} className="input">
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Created by: {task.creator.name}</span>
            </div>
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                Created: {format(new Date(task.createdAt), 'MMM d, yyyy HH:mm')}
              </span>
            </div>

            <div className="mt-4">
              <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <select {...register('assignedToId')} className="input max-w-xs">
                <option value="">Unassigned</option>
                {usersData?.data?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-danger flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Task</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../components/Layout';
import { Priority, TaskStatus } from '../types';
import { api } from '../lib/api';
import { mutate } from 'swr';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.ToDo),
  assignedToId: z.string().uuid().optional().nullable(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

import useSWR from 'swr';

export function CreateTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: TaskStatus.ToDo,
      priority: Priority.Medium,
    },
  });

  const { data: usersData } = useSWR('/users', () => api.getUsers());

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.createTask({
        ...data,
        dueDate: new Date(data.dueDate).toISOString(),
        assignedToId: data.assignedToId || null,
      });

      if (response.success) {
        // Invalidate and refetch
        mutate((key) => typeof key === 'string' && key.startsWith('/tasks'));
        navigate('/tasks');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <Link to="/tasks" className="btn btn-secondary inline-flex items-center mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>

        <div className="card max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
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

              <div>
                <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select {...register('assignedToId')} className="input">
                  <option value="">Unassigned</option>
                  {usersData?.data?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}


import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import { Layout } from '../components/Layout';
import { Task, TaskStatus, Priority } from '../types';
import { api } from '../lib/api';
import { socketClient } from '../lib/socket';
import { format } from 'date-fns';
import { Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Link } from 'react-router-dom';

function TaskCard({ task }: { task: Task }) {
  const priorityColors = {
    Low: 'bg-blue-100 text-blue-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    ToDo: 'bg-gray-100 text-gray-800',
    InProgress: 'bg-blue-100 text-blue-800',
    Review: 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800',
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="card hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        {isOverdue && (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Overdue</span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status]}`}>
          {task.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
        </div>
        <div className="text-xs">
          {task.assignedTo ? `Assigned to: ${task.assignedTo.name}` : 'Unassigned'}
        </div>
      </div>
    </Link>
  );
}

export function Tasks() {
  const { mutate } = useSWRConfig();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'priority'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const params = new URLSearchParams();
  if (statusFilter) params.append('status', statusFilter);
  if (priorityFilter) params.append('priority', priorityFilter);
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const { data, error, isLoading } = useSWR<{ success: boolean; data: Task[] }>(
    `/tasks?${params.toString()}`,
    () => api.getTasks({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      sortBy,
      sortOrder,
    })
  );

  useEffect(() => {
    // Connect socket if not already connected
    if (!socketClient.isConnected()) {
      socketClient.connect();
    }

    // Listen for task updates
    const handleTaskUpdate = () => {
      mutate((key) => typeof key === 'string' && key.startsWith('/tasks'));
    };

    socketClient.on('task:updated', handleTaskUpdate);

    return () => {
      socketClient.off('task:updated', handleTaskUpdate);
    };
  }, [mutate]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-1/3 mb-2"></div>
              <div className="skeleton h-4 w-full mb-2"></div>
              <div className="skeleton h-4 w-2/3"></div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (error || !data?.success) {
    return (
      <Layout>
        <div className="card">
          <p className="text-red-600">Failed to load tasks</p>
        </div>
      </Layout>
    );
  }

  const tasks = data.data;

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <Link to="/tasks/new" className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </div>

        {/* Filters and Sorting */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="input text-sm"
            >
              <option value="">All Statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
              className="input text-sm"
            >
              <option value="">All Priorities</option>
              {Object.values(Priority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <div className="flex items-center ml-auto">
              <span className="text-sm font-medium text-gray-700 mr-2">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input text-sm mr-2"
              >
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Created Date</option>
                <option value="priority">Priority</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="btn btn-secondary flex items-center"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No tasks found</p>
            <Link to="/tasks/new" className="btn btn-primary inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create your first task
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}


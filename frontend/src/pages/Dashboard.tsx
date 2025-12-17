import React, { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';
import { Layout } from '../components/Layout';
import { DashboardData, Task } from '../types';
import { api } from '../lib/api';
import { socketClient } from '../lib/socket';
import { format } from 'date-fns';
import { CheckSquare, Clock, AlertCircle, Calendar } from 'lucide-react';
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
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
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
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {format(new Date(task.dueDate), 'MMM d, yyyy')}
        </div>
        {task.assignedTo && (
          <div className="text-xs">
            Assigned to: {task.assignedTo.name}
          </div>
        )}
      </div>
    </Link>
  );
}

function TaskSection({ title, tasks, icon: Icon, emptyMessage }: {
  title: string;
  tasks: Task[];
  icon: React.ElementType;
  emptyMessage: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <Icon className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-gray-500 italic">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR<{ success: boolean; data: DashboardData }>(
    '/tasks/dashboard',
    () => api.getDashboard()
  );

  useEffect(() => {
    // Connect socket if not already connected
    if (!socketClient.isConnected()) {
      socketClient.connect();
    }

    // Listen for task updates
    const handleTaskUpdate = () => {
      mutate('/tasks/dashboard');
      mutate('/tasks');
    };

    socketClient.on('task:updated', handleTaskUpdate);

    return () => {
      socketClient.off('task:updated', handleTaskUpdate);
    };
  }, [mutate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </Layout>
    );
  }

  const { assignedTasks, createdTasks, overdueTasks } = data.data;

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <TaskSection
          title="Overdue Tasks"
          tasks={overdueTasks}
          icon={AlertCircle}
          emptyMessage="No overdue tasks. Great job!"
        />

        <TaskSection
          title="Assigned to Me"
          tasks={assignedTasks}
          icon={CheckSquare}
          emptyMessage="No tasks assigned to you"
        />

        <TaskSection
          title="Created by Me"
          tasks={createdTasks}
          icon={Clock}
          emptyMessage="You haven't created any tasks yet"
        />
      </div>
    </Layout>
  );
}


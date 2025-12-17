import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../lib/api';
import { socketClient } from '../lib/socket';
import { Notification } from '../types';
import { Link } from 'react-router-dom';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications(false);
      if (res.success) setNotifications(res.data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNew = (n: Notification) => {
      setNotifications((prev) => [n, ...prev]);
    };

    socketClient.on('notification:new', handleNew);
    return () => {
      socketClient.off('notification:new', handleNew);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
    } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="badge absolute -top-1 -right-1">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <strong className="text-sm">Notifications</strong>
            <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
            {!loading && notifications.length === 0 && (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            )}

            {!loading && notifications.map((n) => (
              <div key={n.id} className={`p-3 hover:bg-gray-50 ${n.read ? 'opacity-70' : ''}`}>
                <div className="text-sm text-gray-800">{n.message}</div>
                {n.task && (
                  <div className="text-xs text-gray-500 mt-1">Task: <Link to={`/tasks/${n.task.id}`} className="text-primary-600 hover:underline">{n.task.title}</Link></div>
                )}
                {n.assignedBy && (
                  <div className="text-xs text-gray-500 mt-1">Assigned by: {n.assignedBy.name}</div>
                )}
                {!n.read && (
                  <div className="mt-2">
                    <button onClick={() => markAsRead(n.id)} className="text-xs text-primary-600 hover:underline">Mark as read</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


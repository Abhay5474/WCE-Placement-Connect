import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();

  // Optimistically update the shared ['notifications'] cache so the list AND the
  // navbar bell change instantly — no page reload.
  const patch = (updater) =>
    qc.setQueryData(['notifications'], (prev) => {
      if (!prev) return prev;
      const next = updater(prev.data || []);
      const unread = next.filter((n) => !n.read).length;
      return { ...prev, data: next, meta: { ...prev.meta, unread } };
    });

  const markAll = async () => {
    patch((list) => list.map((n) => ({ ...n, read: true })));
    try { await api.post('/notifications/read-all'); } catch { qc.invalidateQueries({ queryKey: ['notifications'] }); }
  };
  const markOne = async (id) => {
    patch((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try { await api.post(`/notifications/${id}/read`); } catch { qc.invalidateQueries({ queryKey: ['notifications'] }); }
  };

  if (isLoading) return <Spinner />;
  const items = data?.data || [];
  const unread = data?.meta?.unread || 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Notifications {unread > 0 && <span className="ml-1 text-base font-semibold text-brand-600">({unread})</span>}
        </h1>
        <button onClick={markAll} className="btn-ghost text-sm" disabled={!unread}>Mark all read</button>
      </div>
      {items.length ? (
        <div className="card divide-y divide-slate-100">
          {items.map((n) => (
            <Link key={n._id} to={n.link || '#'} onClick={() => markOne(n._id)}
              className={`flex items-center gap-3 p-4 transition hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/40'}`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand-600'}`} />
              <div className="flex-1">
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="No notifications" subtitle="You're all caught up." />}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useNotifications } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function Notifications() {
  const { data, isLoading, refetch } = useNotifications();
  if (isLoading) return <Spinner />;

  const markAll = async () => { await api.post('/notifications/read-all'); refetch(); };
  const markOne = async (id) => { await api.post(`/notifications/${id}/read`); refetch(); };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
        <button onClick={markAll} className="btn-ghost text-sm">Mark all read</button>
      </div>
      {data?.data?.length ? (
        <div className="card divide-y divide-slate-100">
          {data.data.map((n) => (
            <Link key={n._id} to={n.link || '#'} onClick={() => markOne(n._id)}
              className={`flex items-center gap-3 p-4 hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/40'}`}>
              {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
              <div className="flex-1">
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="No notifications" />}
    </div>
  );
}

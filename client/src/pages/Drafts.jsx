import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function Drafts() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => api.get('/blogs/mine', { params: { status: 'draft', limit: 50 } }).then((r) => r.data),
  });
  if (isLoading) return <Spinner />;

  const del = async (id) => { if (confirm('Delete this draft?')) { await api.delete(`/blogs/${id}`); refetch(); } };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">My Drafts</h1>
      {data?.data?.length ? (
        <div className="space-y-3">
          {data.data.map((b) => (
            <div key={b._id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-slate-800">{b.title || 'Untitled draft'}</p>
                <p className="text-xs text-slate-400">Updated {new Date(b.updatedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/edit/${b._id}`} className="btn-ghost text-sm">Edit</Link>
                <button onClick={() => del(b._id)} className="btn-ghost text-sm text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No drafts" subtitle="Start writing a placement experience." action={<Link to="/create" className="btn-primary mt-2">Write</Link>} />}
    </div>
  );
}

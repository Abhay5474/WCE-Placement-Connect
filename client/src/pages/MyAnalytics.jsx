import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Spinner } from '../components/ui.jsx';

export default function MyAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-analytics'],
    queryFn: () => api.get('/users/me/analytics').then((r) => r.data.data),
  });
  if (isLoading) return <Spinner />;
  const { totals, perBlog } = data;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">My Analytics</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[['Blogs', totals.blogs], ['Views', totals.views], ['Likes', totals.likes], ['Comments', totals.comments], ['Saves', totals.bookmarks]].map(([l, v]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{v || 0}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Per blog</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="p-3">Title</th><th className="p-3">Status</th><th className="p-3">Views</th><th className="p-3">Likes</th><th className="p-3">Comments</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {perBlog.map((b) => (
              <tr key={b._id}>
                <td className="p-3"><Link to={`/blog/${b.slug}`} className="font-medium text-brand-600 hover:underline">{b.title}</Link></td>
                <td className="p-3"><span className="badge bg-slate-100 capitalize text-slate-600">{b.status}</span></td>
                <td className="p-3">{b.views}</td><td className="p-3">{b.likeCount}</td><td className="p-3">{b.commentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

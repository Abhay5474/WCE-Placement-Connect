import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function Saved() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get('/bookmarks', { params: { limit: 50 } }).then((r) => r.data),
  });
  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">Saved blogs</h1>
      {data?.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.data.map((b) => <BlogCard key={b._id} blog={b} />)}</div>
      ) : <EmptyState title="No saved blogs" subtitle="Tap Save on any blog to keep it here." />}
    </div>
  );
}

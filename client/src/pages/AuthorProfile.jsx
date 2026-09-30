import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, EmptyState } from '../components/ui.jsx';
import { useState } from 'react';

export default function AuthorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['author', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data.data),
  });
  const [following, setFollowing] = useState(null);

  if (isLoading) return <Spinner />;
  if (!data) return <EmptyState title="User not found" />;
  const { author, blogs, stats } = data;
  const isFollowing = following ?? data.isFollowing;

  const toggle = async () => {
    const { data: r } = await api.post(`/users/${id}/follow`);
    setFollowing(r.data.following);
    refetch();
  };

  return (
    <div>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{author.name[0]}</div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{author.name}</h1>
            <p className="text-sm capitalize text-slate-500">{author.role} · {author.department}</p>
            {author.bio && <p className="mt-1 max-w-md text-sm text-slate-600">{author.bio}</p>}
            <div className="mt-2 flex gap-4 text-sm text-slate-500">
              <span><b className="text-slate-800">{stats.followers}</b> followers</span>
              <span><b className="text-slate-800">{stats.blogs}</b> blogs</span>
            </div>
          </div>
        </div>
        {user && String(user.id) !== String(id) && (
          <button onClick={toggle} className={isFollowing ? 'btn-ghost' : 'btn-primary'}>{isFollowing ? 'Following' : 'Follow'}</button>
        )}
      </div>

      <h2 className="mb-3 mt-6 text-lg font-bold">Published blogs</h2>
      {blogs.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{blogs.map((b) => <BlogCard key={b._id} blog={b} />)}</div>
      ) : <EmptyState title="No public blogs yet" />}
    </div>
  );
}

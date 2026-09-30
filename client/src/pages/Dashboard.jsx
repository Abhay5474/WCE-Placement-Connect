import { Link } from 'react-router-dom';
import { useDashboard } from '../lib/hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, SectionHeader, EmptyState } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  if (isLoading) return <Spinner />;
  const d = data?.data || {};

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <h1 className="text-2xl font-extrabold">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="text-brand-100">Your placement preparation dashboard.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/create" className="btn bg-white text-brand-700 hover:bg-brand-50">Write an experience</Link>
          <Link to="/placement/profile" className="btn bg-white/10 text-white hover:bg-white/20">Edit placement profile</Link>
        </div>
      </div>

      {/* Recommended */}
      <section>
        <SectionHeader title="Recommended for you" subtitle="Based on your profile, skills and activity" />
        {d.recommendedBlogs?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {d.recommendedBlogs.map((b) => (
              <div key={b._id}>
                <BlogCard blog={b} />
                {b._recommendation?.reasons && (
                  <p className="mt-1 px-1 text-xs text-slate-400">Why: {b._recommendation.reasons.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        ) : <EmptyState title="Set your placement profile" subtitle="Add skills and target companies to get recommendations." action={<Link to="/placement/profile" className="btn-primary mt-2">Set profile</Link>} />}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="mb-3 font-bold">Popular interview questions</h3>
          <ul className="space-y-2 text-sm">
            {(d.interviewQuestions || []).slice(0, 6).map((q) => (
              <li key={q._id}>· {q.question} <span className="text-xs text-slate-400">({q.topic})</span></li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h3 className="mb-3 font-bold">Recently viewed</h3>
          {d.recentlyViewed?.length ? (
            <ul className="space-y-2 text-sm">
              {d.recentlyViewed.map((b) => <li key={b._id}><Link to={`/blog/${b.slug}`} className="text-brand-600 hover:underline">{b.title}</Link></li>)}
            </ul>
          ) : <p className="text-sm text-slate-400">Nothing yet.</p>}
        </section>
      </div>

      {d.bookmarks?.length > 0 && (
        <section>
          <SectionHeader title="Saved blogs" to="/saved" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{d.bookmarks.map((b) => <BlogCard key={b._id} blog={b} />)}</div>
        </section>
      )}
    </div>
  );
}

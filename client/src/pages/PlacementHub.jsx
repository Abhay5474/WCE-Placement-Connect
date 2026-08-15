import { Link } from 'react-router-dom';
import { usePlacementHub } from '../lib/hooks.js';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, SectionHeader } from '../components/ui.jsx';

export default function PlacementHub() {
  const { data, isLoading } = usePlacementHub();
  const hub = data?.data;
  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Placement Knowledge Hub</h1>
        <p className="text-slate-600">Everything you need to prepare — experiences, companies, questions and AI guidance.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/companies" className="btn-ghost">Browse companies</Link>
          <Link to="/interview-questions" className="btn-ghost">Interview questions</Link>
          <Link to="/assistant" className="btn-primary">✨ Ask the AI assistant</Link>
        </div>
      </div>

      <section>
        <SectionHeader title="Latest experiences" to="/explore" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(hub?.latestExperiences || []).map((b) => <BlogCard key={b._id} blog={b} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-slate-900">Popular interview questions</h2>
          <ul className="space-y-2 text-sm">
            {(hub?.popularQuestions || []).map((q) => (
              <li key={q._id} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand-500">›</span>
                <span><span className="font-medium">{q.question}</span>
                  <span className="ml-2 text-xs text-slate-400">{q.topic} · asked in {q.frequency} experience(s)</span></span>
              </li>
            ))}
          </ul>
          <Link to="/interview-questions" className="mt-3 inline-block text-sm font-semibold text-brand-600">All questions →</Link>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold text-slate-900">Companies</h2>
          <div className="flex flex-wrap gap-2">
            {(hub?.companies || []).map((c) => (
              <Link key={c._id} to={`/companies/${c.slug}`} className="badge bg-slate-100 text-slate-700 hover:bg-slate-200">{c.name}</Link>
            ))}
          </div>
        </section>
      </div>

      <section>
        <SectionHeader title="Recently added" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(hub?.recentlyAdded || []).map((b) => <BlogCard key={b._id} blog={b} />)}
        </div>
      </section>
    </div>
  );
}

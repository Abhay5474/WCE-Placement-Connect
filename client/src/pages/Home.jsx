import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePlacementHub } from '../lib/hooks.js';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, SectionHeader } from '../components/ui.jsx';

export default function Home() {
  const { data, isLoading } = usePlacementHub();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const hub = data?.data;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-200">Placement Knowledge, Preserved</p>
        <h1 className="mx-auto max-w-3xl text-3xl font-extrabold sm:text-4xl">
          Learn from every senior's placement experience — searchable, structured, AI-powered.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-brand-100">
          Interview experiences, company insights, questions and a grounded AI assistant that answers from your college's own knowledge.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(q)}&mode=semantic`); }}
          className="mx-auto mt-6 flex max-w-xl gap-2"
        >
          <input className="input flex-1 text-slate-800" placeholder="Try: interviews with graph problems…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn bg-white text-brand-700 hover:bg-brand-50">Search</button>
        </form>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link to="/placement" className="rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20">Placement Hub</Link>
          <Link to="/assistant" className="rounded-lg bg-white/10 px-4 py-2 font-medium hover:bg-white/20">✨ AI Assistant</Link>
        </div>
      </section>

      {isLoading ? <Spinner /> : (
        <>
          <section>
            <SectionHeader title="Latest placement experiences" subtitle="Fresh from your seniors" to="/explore" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(hub?.latestExperiences || []).slice(0, 6).map((b) => <BlogCard key={b._id} blog={b} />)}
            </div>
          </section>

          <section>
            <SectionHeader title="Trending companies" to="/companies" />
            <div className="flex flex-wrap gap-2">
              {(hub?.trendingCompanies || []).map((c) => (
                <span key={c._id} className="badge bg-white text-slate-700 shadow-sm">{c.name} · {c.count}</span>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Most helpful" to="/explore" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(hub?.mostHelpful || []).slice(0, 3).map((b) => <BlogCard key={b._id} blog={b} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

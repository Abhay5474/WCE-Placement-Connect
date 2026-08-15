import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, EmptyState, Chip } from '../components/ui.jsx';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [mode, setMode] = useState(params.get('mode') || 'keyword');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usedMode, setUsedMode] = useState('');

  const run = async (query = q, m = mode) => {
    if (!query.trim()) return;
    setLoading(true);
    setParams({ q: query, mode: m });
    try {
      const { data } = await api.get('/search', { params: { q: query, mode: m } });
      setResults(data.data.results || []);
      setUsedMode(data.data.mode);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (params.get('q')) run(params.get('q'), params.get('mode') || 'keyword');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="mb-3 text-2xl font-extrabold text-slate-900">Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-wrap gap-2">
        <input className="input flex-1" placeholder="Search experiences, questions, companies…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary">Search</button>
      </form>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-slate-500">Mode:</span>
        <Chip active={mode === 'keyword'} onClick={() => { setMode('keyword'); if (q) run(q, 'keyword'); }}>Keyword</Chip>
        <Chip active={mode === 'semantic'} onClick={() => { setMode('semantic'); if (q) run(q, 'semantic'); }}>✨ Semantic</Chip>
        {usedMode && <span className="text-xs text-slate-400">Showing: {usedMode}</span>}
      </div>

      <div className="mt-6">
        {loading ? <Spinner /> : results === null ? (
          <p className="text-sm text-slate-500">Enter a query to search. Semantic mode finds relevant results even with different wording.</p>
        ) : results.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <div key={r.blog._id} className="relative">
                {r.score != null && (
                  <span className="absolute right-3 top-3 z-10 badge bg-violet-100 text-violet-700">
                    {(r.score * 100).toFixed(0)}% match
                  </span>
                )}
                <BlogCard blog={r.blog} />
              </div>
            ))}
          </div>
        ) : <EmptyState title="No results" subtitle="Try semantic mode or a broader query." />}
      </div>
    </div>
  );
}

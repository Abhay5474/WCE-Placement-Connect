import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AIBadge } from '../components/ui.jsx';

const SUGGESTIONS = [
  'How should I prepare for a Java backend developer interview?',
  'I have 30 days to prepare for a product-based company. What should I focus on?',
  'What DSA topics come up most in on-campus interviews?',
];

export default function Assistant() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setError(''); setAnswer(null);
    try {
      const { data } = await api.post('/ai/assistant', { query: q });
      setAnswer(data.data);
    } catch (e) { setError(errMessage(e)); } finally { setLoading(false); }
  };

  if (!user) {
    return (
      <div className="card p-10 text-center">
        <h1 className="text-xl font-bold">AI Placement Assistant</h1>
        <p className="mt-2 text-sm text-slate-500"><Link to="/login" className="text-brand-600">Sign in</Link> to ask the assistant.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-extrabold text-slate-900">AI Placement Assistant</h1><AIBadge />
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Answers are grounded in WCEConnect AI content and cite the source blogs. It won't invent college-specific facts.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2">
        <input className="input flex-1" placeholder="Ask a placement question…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-primary" disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => { setQuery(s); ask(s); }} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">{s}</button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {answer && (
        <div className="mt-6 card p-5">
          <div className="mb-2 flex items-center gap-2">
            <AIBadge />
            {!answer.grounded && <span className="badge bg-amber-100 text-amber-700">Insufficient content</span>}
          </div>
          <p className="whitespace-pre-line text-slate-800">{answer.answer}</p>

          {answer.citations?.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-sm font-semibold text-slate-600">{answer.note}</p>
              <ul className="space-y-1 text-sm">
                {answer.citations.map((c) => (
                  <li key={c.id}>
                    <Link to={`/blog/${c.slug}`} className="text-brand-600 hover:underline">[{c.index}] {c.title}</Link>
                    {c.company && <span className="ml-2 text-xs text-slate-400">{c.company}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

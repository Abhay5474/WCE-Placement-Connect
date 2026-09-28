import { useState } from 'react';
import { useInterviewQuestions } from '../lib/hooks.js';
import QuestionCard from '../components/QuestionCard.jsx';
import { Spinner, EmptyState } from '../components/ui.jsx';

const TOPICS = [
  { id: '', label: 'All', icon: '✨' },
  { id: 'DSA', label: 'DSA', icon: '🧮' },
  { id: 'System Design', label: 'System Design', icon: '🏗️' },
  { id: 'DBMS', label: 'DBMS', icon: '🗄️' },
  { id: 'OS', label: 'OS', icon: '⚙️' },
  { id: 'OOP', label: 'OOP', icon: '🧩' },
  { id: 'Networking', label: 'Networking', icon: '🌐' },
  { id: 'HR', label: 'HR', icon: '💬' },
];
const DIFF = ['Easy', 'Medium', 'Hard'];

export default function InterviewQuestions() {
  const [filters, setFilters] = useState({ topic: '', difficulty: '', company: '', q: '' });
  const { data, isLoading } = useInterviewQuestions(filters);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const items = data?.data || [];

  return (
    <div>
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-brand-600 to-fuchsia-600 p-6 text-white">
        <h1 className="text-2xl font-extrabold">Interview Question Bank</h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-100">
          Real questions auto-extracted from student placement experiences. Frequency counts how many
          distinct experiences mentioned each question — no made-up numbers.
        </p>
        <div className="mt-4 max-w-md">
          <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 backdrop-blur">
            <span className="text-white/70">🔎</span>
            <input
              className="w-full bg-transparent text-sm text-white placeholder-white/60 outline-none"
              placeholder="Search questions…" value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t.id} onClick={() => set({ topic: t.id })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                filters.topic === t.id ? 'border-brand-600 bg-brand-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input className="input max-w-xs" placeholder="Filter by company…" value={filters.company}
            onChange={(e) => set({ company: e.target.value })} />
          <div className="flex gap-1.5">
            <button onClick={() => set({ difficulty: '' })}
              className={`rounded-full border px-3 py-1 text-xs ${!filters.difficulty ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Any</button>
            {DIFF.map((d) => (
              <button key={d} onClick={() => set({ difficulty: d })}
                className={`rounded-full border px-3 py-1 text-xs ${filters.difficulty === d ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <Spinner /> : items.length ? (
        <>
          <p className="mb-3 text-sm text-slate-500">{items.length} question{items.length !== 1 ? 's' : ''}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((q) => <QuestionCard key={q._id} q={q} />)}
          </div>
        </>
      ) : (
        <EmptyState title="No questions match your filters"
          subtitle="Try a different topic, or publish placement experiences so the AI can extract questions." />
      )}
    </div>
  );
}

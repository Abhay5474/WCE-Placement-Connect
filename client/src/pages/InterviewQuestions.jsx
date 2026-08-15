import { useState } from 'react';
import { useInterviewQuestions } from '../lib/hooks.js';
import { Spinner, EmptyState, Chip } from '../components/ui.jsx';

const TOPICS = ['DSA', 'System Design', 'DBMS', 'OS', 'Networking', 'HR', 'General'];
const DIFF = ['Easy', 'Medium', 'Hard'];

export default function InterviewQuestions() {
  const [filters, setFilters] = useState({ topic: '', difficulty: '', company: '', q: '' });
  const { data, isLoading } = useInterviewQuestions(filters);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Interview Questions</h1>
      <p className="mb-4 text-sm text-slate-500">Auto-extracted from placement experiences. Frequency counts distinct source experiences.</p>

      <div className="mb-4 space-y-3">
        <input className="input max-w-sm" placeholder="Filter by company…" value={filters.company}
          onChange={(e) => set({ company: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.topic} onClick={() => set({ topic: '' })}>All topics</Chip>
          {TOPICS.map((t) => <Chip key={t} active={filters.topic === t} onClick={() => set({ topic: t })}>{t}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.difficulty} onClick={() => set({ difficulty: '' })}>Any difficulty</Chip>
          {DIFF.map((d) => <Chip key={d} active={filters.difficulty === d} onClick={() => set({ difficulty: d })}>{d}</Chip>)}
        </div>
      </div>

      {isLoading ? <Spinner /> : (data?.data?.length ? (
        <div className="card divide-y divide-slate-100">
          {data.data.map((q) => (
            <div key={q._id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-medium text-slate-800">{q.question}</p>
                <p className="text-xs text-slate-400">
                  {q.companyName || 'General'} · {q.topic} · asked in {q.frequency} experience(s)
                  {q.verified && <span className="ml-2 text-emerald-600">✓ verified</span>}
                </p>
              </div>
              <span className="badge bg-slate-100 text-slate-600">{q.difficulty}</span>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No questions found" />)}
    </div>
  );
}

const TOPIC_STYLE = {
  DSA: 'bg-indigo-100 text-indigo-700',
  'System Design': 'bg-fuchsia-100 text-fuchsia-700',
  DBMS: 'bg-cyan-100 text-cyan-700',
  OS: 'bg-teal-100 text-teal-700',
  OOP: 'bg-emerald-100 text-emerald-700',
  Networking: 'bg-sky-100 text-sky-700',
  HR: 'bg-rose-100 text-rose-700',
  General: 'bg-slate-100 text-slate-600',
};
const TOPIC_ICON = {
  DSA: '🧮', 'System Design': '🏗️', DBMS: '🗄️', OS: '⚙️', OOP: '🧩', Networking: '🌐', HR: '💬', General: '❓',
};
const DIFF_STYLE = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
};

// Defensive: strip any stray HTML from legacy rows so tags never render as text.
const clean = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default function QuestionCard({ q }) {
  const topic = q.topic || 'General';
  const question = clean(q.question);
  return (
    <div className="group card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${TOPIC_STYLE[topic] || TOPIC_STYLE.General}`}>
          {TOPIC_ICON[topic] || '❓'}
        </span>
        <p className="font-medium leading-snug text-slate-800">{question}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pl-12 text-xs">
        <span className={`badge ${TOPIC_STYLE[topic] || TOPIC_STYLE.General}`}>{topic}</span>
        {q.difficulty && <span className={`badge ${DIFF_STYLE[q.difficulty] || DIFF_STYLE.Medium}`}>{q.difficulty}</span>}
        {q.companyName && <span className="badge bg-slate-100 text-slate-600">🏢 {q.companyName}</span>}
        {q.frequency > 0 && (
          <span className="badge bg-brand-50 text-brand-700" title="Counted from stored student experiences">
            ×{q.frequency} asked
          </span>
        )}
        {q.verified && <span className="badge bg-emerald-100 text-emerald-700">✓ Verified</span>}
      </div>
    </div>
  );
}

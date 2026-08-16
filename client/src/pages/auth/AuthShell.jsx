import { useAuth } from '../../context/AuthContext.jsx';

export default function AuthShell({ title, subtitle, children }) {
  const { config } = useAuth();
  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-8 md:grid-cols-2 md:items-center">
      <div className="hidden md:block">
        <div className="mb-3 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">W</span>
          WCEConnect <span className="text-brand-600">AI</span>
        </div>
        <p className="text-lg font-semibold text-slate-800">Your college's placement knowledge, searchable forever.</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-500">
          <li>✓ Real interview experiences from seniors</li>
          <li>✓ AI writing assistant, summaries &amp; tags</li>
          <li>✓ Semantic search &amp; a grounded AI placement assistant</li>
          <li>✓ Company knowledge base &amp; interview questions</li>
        </ul>
        <p className="mt-6 text-xs text-slate-400">
          Anyone can join and read experiences. Adding your own experience requires admin-granted access.
        </p>
      </div>
      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mb-4 text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

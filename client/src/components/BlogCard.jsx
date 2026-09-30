import { Link } from 'react-router-dom';
import { TrustBadge } from './ui.jsx';

/* Placement blog card with rich metadata (company, role, rounds, difficulty…). */
export default function BlogCard({ blog }) {
  const p = blog.placement || {};
  const author = blog.author || {};
  return (
    <Link to={`/blog/${blog.slug}`} className="card block p-5 transition hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <TrustBadge level={blog.trustLevel} />
        {blog.highlighted && <span className="badge bg-amber-100 text-amber-700">⭐ Highlighted</span>}
        {(blog.categories || []).slice(0, 1).map((c) => (
          <span key={c} className="badge bg-slate-100 text-slate-600">{c}</span>
        ))}
      </div>

      <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{blog.title}</h3>
      {blog.excerpt && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{blog.excerpt}</p>}

      {blog.type === 'placement' && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
          {p.companyName && <Meta k="Company" v={p.companyName} />}
          {p.role && <Meta k="Role" v={p.role} />}
          {p.placementType && <Meta k="Type" v={p.placementType} />}
          {p.department && <Meta k="Branch" v={p.department} />}
          {p.year && <Meta k="Year" v={p.year} />}
          {Array.isArray(p.rounds) && p.rounds.length > 0 && <Meta k="Rounds" v={p.rounds.length} />}
          {p.difficulty && <Meta k="Difficulty" v={p.difficulty} />}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{author.anonymous ? 'Anonymous' : author.name}</span>
        <span className="flex items-center gap-3">
          <span>⏱ {blog.readingTimeMin || 1} min</span>
          <span>👁 {blog.views || 0}</span>
          <span>❤ {blog.likeCount || 0}</span>
        </span>
      </div>

      {(blog.tags || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {blog.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">#{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

const Meta = ({ k, v }) => (
  <div><span className="text-slate-400">{k}: </span><span className="font-medium">{v}</span></div>
);

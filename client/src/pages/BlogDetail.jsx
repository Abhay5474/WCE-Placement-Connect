import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBlog } from '../lib/hooks.js';
import { api, errMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState, AIBadge, TrustBadge } from '../components/ui.jsx';
import QuestionCard from '../components/QuestionCard.jsx';

export default function BlogDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useBlog(slug);
  const [state, setState] = useState({ liked: false, bookmarked: false, likeCount: 0 });
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [regen, setRegen] = useState(false);

  const d = data?.data;
  useEffect(() => {
    if (d) {
      setState({ liked: d.viewer?.liked, bookmarked: d.viewer?.bookmarked, likeCount: d.blog.likeCount });
      api.get(`/blogs/${d.blog._id}/comments`).then((r) => setComments(r.data.data)).catch(() => {});
    }
  }, [d]);

  if (isLoading) return <Spinner />;
  if (!d) return <EmptyState title="Blog not found" />;
  const { blog, ai, interviewQuestions } = d;
  const p = blog.placement || {};
  // Strip any stray HTML tags from the AI summary so only clean prose shows.
  const plainSummary = String(ai?.summary || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const regenerate = async () => {
    setRegen(true);
    try {
      await api.post(`/ai/blogs/${blog._id}/reprocess`);
      await qc.invalidateQueries({ queryKey: ['blog', slug] });
    } catch (e) { alert(errMessage(e)); } finally { setRegen(false); }
  };

  const toggleLike = async () => {
    const { data: r } = await api.post(`/blogs/${blog._id}/like`);
    setState((s) => ({ ...s, liked: r.data.liked, likeCount: r.data.likeCount }));
  };
  const toggleBookmark = async () => {
    const { data: r } = await api.post(`/blogs/${blog._id}/bookmark`);
    setState((s) => ({ ...s, bookmarked: r.data.bookmarked }));
  };
  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const { data: r } = await api.post(`/blogs/${blog._id}/comments`, { content: comment });
    setComments((c) => [r.data.comment, ...c]);
    setComment('');
  };
  const report = async () => {
    const reason = prompt('Why are you reporting this content?');
    if (!reason) return;
    try { await api.post('/users/reports', { targetType: 'blog', blog: blog._id, reason }); alert('Reported for review. Thank you.'); }
    catch (e) { alert(errMessage(e)); }
  };

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TrustBadge level={blog.trustLevel} />
        {(blog.categories || []).map((c) => <span key={c} className="badge bg-slate-100 text-slate-600">{c}</span>)}
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">{blog.title}</h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
        {blog.author?.anonymous ? <span className="font-medium">Anonymous</span> : (
          <Link to={`/author/${blog.author?._id}`} className="font-medium text-slate-700 hover:underline">{blog.author?.name}</Link>
        )}
        <span>· {blog.readingTimeMin} min read · 👁 {blog.views}</span>
      </div>

      {/* AI narrative summary (plain text only, no HTML, no field grid) */}
      {ai?.summary && plainSummary && (
        <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <div className="mb-2 flex items-center gap-2"><span className="font-semibold text-violet-900">AI Summary</span><AIBadge /></div>
          <p className="text-sm leading-relaxed text-slate-700">{plainSummary}</p>
        </div>
      )}

      {/* Placement metadata */}
      {blog.type === 'placement' && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-4">
          {p.companyName && <Meta k="Company" v={p.companyName} />}
          {p.role && <Meta k="Role" v={p.role} />}
          {p.difficulty && <Meta k="Difficulty" v={p.difficulty} />}
          {p.result && <Meta k="Result" v={p.result} />}
        </div>
      )}

      <div className="rich-content mt-6" dangerouslySetInnerHTML={{ __html: blog.content }} />

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-slate-100 py-3">
        <button onClick={user ? toggleLike : undefined} className={`btn-ghost ${state.liked ? 'text-red-600' : ''}`} disabled={!user}>❤ {state.likeCount}</button>
        <button onClick={user ? toggleBookmark : undefined} className={`btn-ghost ${state.bookmarked ? 'text-brand-600' : ''}`} disabled={!user}>{state.bookmarked ? '★ Saved' : '☆ Save'}</button>
        {user && <button onClick={report} className="btn-ghost text-slate-500">⚑ Report</button>}
        {user && String(user.id) === String(blog.author?._id) && (
          <>
            <Link to={`/edit/${blog._id}`} className="btn-ghost">Edit</Link>
            <button onClick={regenerate} className="btn-ghost text-violet-600" disabled={regen} title="Re-run AI summary & question extraction">
              {regen ? 'Regenerating…' : '✨ Regenerate AI'}
            </button>
          </>
        )}
      </div>

      {interviewQuestions?.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 font-bold">Extracted interview questions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {interviewQuestions.map((q) => <QuestionCard key={q._id} q={q} />)}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="mt-8">
        <h3 className="mb-3 font-bold">Comments ({comments.length})</h3>
        {user ? (
          <form onSubmit={postComment} className="mb-4 flex gap-2">
            <input className="input flex-1" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn-primary">Post</button>
          </form>
        ) : <p className="mb-4 text-sm text-slate-500"><Link to="/login" className="text-brand-600">Sign in</Link> to comment.</p>}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c._id} className="card p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.author?.name}</span>
                <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

const Meta = ({ k, v }) => (<div><span className="text-slate-400">{k}: </span><span className="font-medium">{v}</span></div>);

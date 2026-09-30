import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AIBadge, ErrorNote } from '../components/ui.jsx';
import RequestAccess from '../components/RequestAccess.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { stripHtml } from '../lib/beautify.js';

const PLACEMENT_TYPES = ['Internship', 'Full Time', 'PPO'];

const blankForm = () => ({
  title: '', content: '', type: 'placement', isAnonymous: false,
  categories: [], tags: [],
  placement: {
    companyName: '', role: '', placementType: 'Full Time', year: new Date().getFullYear(),
    department: '', result: 'Selected', preparationDuration: '', ctc: '', fieldVisibility: { ctc: false },
  },
});

const PLACEMENT_TEMPLATE = `<h2>Company</h2><p></p>
<h2>Job Role</h2><p></p>
<h2>Placement Type</h2><p>Internship / Full Time / PPO</p>
<h2>Eligibility Criteria</h2><p></p>
<h2>Selection Process</h2>
<h3>Round 1 — Online Assessment</h3><p></p>
<h3>Round 2 — Technical Interview</h3><p></p>
<h3>Round 3 — HR Interview</h3><p></p>
<h2>Questions Asked</h2><p></p>
<h2>Preparation Strategy</h2><p></p>
<h2>Resources Used</h2><p></p>
<h2>Mistakes to Avoid</h2><p></p>
<h2>Final Result</h2><p></p>
<h2>Advice for Juniors</h2><p></p>`;

export default function CreateBlog() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const editing = !!id;

  // Reading is public, but adding/editing experiences requires admin-granted access.
  if (user && !user.canContribute) return <RequestAccess />;

  const draftKey = `wce_draft_${editing ? id : 'new'}`;
  const [form, setForm] = useState(blankForm);
  const [ai, setAi] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);

  // Load: prefer a locally-saved draft (most recent unsaved work), else the
  // server copy (when editing), else a blank form.
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* ignore */ }
    if (saved && typeof saved.content === 'string') {
      setForm((f) => ({ ...f, ...saved, placement: { ...f.placement, ...(saved.placement || {}) } }));
      setRestored(true);
      setLoaded(true);
      return;
    }
    if (editing) {
      api.get('/blogs/mine', { params: { limit: 50 } })
        .then(({ data }) => {
          const blog = data.data.find((b) => b._id === id);
          if (blog) {
            setForm((f) => {
              const placement = { ...f.placement, ...(blog.placement || {}) };
              if (!PLACEMENT_TYPES.includes(placement.placementType)) placement.placementType = 'Full Time';
              return { ...f, ...blog, type: 'placement', placement };
            });
          }
        })
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [editing, id, draftKey]);

  // Auto-save the draft on every change so navigating away never loses work.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(draftKey, JSON.stringify(form)); } catch { /* quota */ }
  }, [form, loaded, draftKey]);

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setForm(blankForm());
    setAi(null); setModeration(null); setRestored(false);
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setP = (patch) => setForm((f) => ({ ...f, placement: { ...f.placement, ...patch } }));
  const toggleCat = (c) => set({ categories: form.categories.includes(c) ? form.categories.filter((x) => x !== c) : [...form.categories, c] });
  const plainLen = stripHtml(form.content).trim().length;

  const analyze = async () => {
    // Send plain text (not HTML) so AI tags/categories aren't polluted by markup.
    const plain = stripHtml(form.content);
    if (plain.length < 10) return null;
    const [{ data: a }, { data: m }] = await Promise.all([
      api.post('/ai/analyze', { title: form.title, content: plain }),
      api.post('/ai/moderation-check', { title: form.title, content: plain }),
    ]);
    setAi(a.data);
    setModeration(m.data);
    return a.data;
  };

  // Categories are derived from the student's own experience text, then chosen.
  const suggestCategories = async () => {
    setSuggesting(true);
    try { await analyze(); } finally { setSuggesting(false); }
  };

  // Options = AI suggestions from the text + anything already selected.
  const categoryOptions = [...new Set([...(form.categories || []), ...((ai?.suggestedCategories) || [])])];

  const save = async (status) => {
    setBusy(true); setError('');
    try {
      const payload = {
        title: form.title, content: form.content, type: 'placement',
        isAnonymous: form.isAnonymous, categories: form.categories, tags: form.tags,
        status, placement: form.placement,
      };
      const res = editing
        ? await api.patch(`/blogs/${id}`, payload)
        : await api.post('/blogs', payload);
      localStorage.removeItem(draftKey); // saved to server → clear local draft
      navigate(status === 'published' ? `/blog/${res.data.data.blog.slug}` : '/drafts');
    } catch (e) { setError(errMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">
          {editing ? 'Edit placement experience' : 'Write a placement experience'}
        </h1>
        {error && <ErrorNote message={error} />}
        {restored && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <span>📝 We restored your unsaved draft.</span>
            <button type="button" onClick={discardDraft} className="font-semibold text-amber-700 underline">Discard &amp; start fresh</button>
          </div>
        )}

        <div className="space-y-4">
          <input className="input text-base font-semibold sm:text-lg" placeholder="Title (e.g. Microsoft SDE Interview Experience)"
            value={form.title} onChange={(e) => set({ title: e.target.value })} />

          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Company"><input className="input" value={form.placement.companyName} onChange={(e) => setP({ companyName: e.target.value })} /></Field>
            <Field label="Role"><input className="input" value={form.placement.role} onChange={(e) => setP({ role: e.target.value })} /></Field>
            <Field label="Type">
              <select className="input" value={form.placement.placementType} onChange={(e) => setP({ placementType: e.target.value })}>
                {PLACEMENT_TYPES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Branch"><input className="input" value={form.placement.department} onChange={(e) => setP({ department: e.target.value })} /></Field>
            <Field label="Year"><input className="input" type="number" value={form.placement.year} onChange={(e) => setP({ year: Number(e.target.value) })} /></Field>
            <Field label="Result">
              <select className="input" value={form.placement.result} onChange={(e) => setP({ result: e.target.value })}>
                {['Selected', 'Rejected', 'In Process', 'Not Disclosed'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Prep duration"><input className="input" placeholder="8 weeks" value={form.placement.preparationDuration} onChange={(e) => setP({ preparationDuration: e.target.value })} /></Field>
            <Field label="CTC (optional)"><input className="input" value={form.placement.ctc} onChange={(e) => setP({ ctc: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2 lg:col-span-3">
              <input type="checkbox" checked={form.placement.fieldVisibility.ctc} onChange={(e) => setP({ fieldVisibility: { ctc: e.target.checked } })} />
              Show CTC publicly (hidden by default)
            </label>
          </div>

          {(!form.content || form.content === '<br>') && (
            <button type="button" onClick={() => set({ content: PLACEMENT_TEMPLATE })} className="btn-ghost text-sm">↳ Insert structured template</button>
          )}

          <RichTextEditor
            value={form.content}
            onChange={(html) => set({ content: html })}
            placeholder="Write your experience — use the toolbar or just type, then hit ✨ Auto-format."
          />
          <p className="-mt-2 text-xs text-slate-400">
            Tip: paste your raw notes and click <b>✨ Auto-format</b> — it cleans spacing, capitalization and
            headings without changing your words.
          </p>

          {/* Categories are suggested from your experience text, then you pick. */}
          <div>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label className="label mb-0">Categories</label>
              <button type="button" onClick={suggestCategories} disabled={plainLen < 10 || suggesting}
                className="text-xs font-semibold text-violet-600 disabled:text-slate-300">
                {suggesting ? 'Analyzing…' : '✨ Suggest from my experience'}
              </button>
            </div>
            {categoryOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((c) => (
                  <button type="button" key={c} onClick={() => toggleCat(c)}
                    className={`rounded-full border px-3 py-1 text-xs ${form.categories.includes(c) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{c}</button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Write your experience, then click “✨ Suggest from my experience” to get categories based on what you wrote.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isAnonymous} onChange={(e) => set({ isAnonymous: e.target.checked })} />
            Post anonymously
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save('draft')} className="btn-ghost" disabled={busy || !form.title}>Save draft</button>
            <button type="button" onClick={() => save('published')} className="btn-primary" disabled={busy || !form.title || plainLen < 10}>Publish</button>
          </div>
        </div>
      </div>

      {/* AI writing assistant panel */}
      <aside className="space-y-4">
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2"><h3 className="font-bold">Writing Assistant</h3><AIBadge /></div>
          <button type="button" onClick={analyze} className="btn-primary w-full text-sm" disabled={plainLen < 10}>Analyze draft</button>

          {moderation?.hasPII && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠ You appear to have included personal information ({moderation.flags.find((f) => f.type === 'personal_information')?.matches.join(', ')}). Please review before publishing.
            </div>
          )}

          {ai && (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Quality score</p>
                <div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-brand-600" style={{ width: `${ai.quality.overall}%` }} /></div>
                <p className="mt-1 text-xs text-slate-400">{ai.quality.overall}/100 · readability {ai.quality.readability} · structure {ai.quality.structure}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Suggested tags</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ai.tags.map((t) => (
                    <button type="button" key={t} onClick={() => !form.tags.includes(t) && set({ tags: [...form.tags, t] })} className="rounded bg-slate-100 px-2 py-0.5 text-xs hover:bg-brand-100">+ {t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Title ideas</p>
                <ul className="mt-1 space-y-1">
                  {ai.titles.map((t) => <li key={t}><button type="button" onClick={() => set({ title: t })} className="text-left text-xs text-brand-600 hover:underline">{t}</button></li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Tone</p>
                <p className="text-xs text-slate-500">{ai.tone.sentiment} · {ai.tone.formality} · {ai.tone.positivity}% positive</p>
              </div>
              {ai.grammar.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-700">Grammar hints</p>
                  <ul className="list-disc pl-4 text-xs text-slate-500">{ai.grammar.map((g, i) => <li key={i}>{g}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>

        {form.tags.length > 0 && (
          <div className="card p-4 text-sm">
            <p className="mb-2 font-semibold text-slate-700">Your tags</p>
            <div className="flex flex-wrap gap-1">
              {form.tags.map((t) => (
                <span key={t} className="badge bg-brand-100 text-brand-700">#{t}
                  <button type="button" onClick={() => set({ tags: form.tags.filter((x) => x !== t) })} className="ml-1">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

const Field = ({ label, children }) => (<div><label className="label text-xs">{label}</label>{children}</div>);

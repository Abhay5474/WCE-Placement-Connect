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

const renderInlineMarkdown = (text = '') => {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (/^\*\*.+\*\*$/.test(part) || /^__.+__$/.test(part)) {
      return <strong key={`${part}-${index}`} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (/^\*.+\*$/.test(part) || /^_.+_$/.test(part)) {
      return <em key={`${part}-${index}`} className="italic text-slate-700">{part.slice(1, -1)}</em>;
    }
    if (/^`.+`$/.test(part)) {
      return <code key={`${part}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.8rem] text-brand-700">{part.slice(1, -1)}</code>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

const splitTableRow = (line) => line
  .trim()
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split('|')
  .map((cell) => cell.trim());

const isTableSeparator = (line) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

const parseTableAt = (lines, startIndex) => {
  const tableLines = [];
  let index = startIndex;

  while (index < lines.length) {
    const current = lines[index].trim();
    if (!current || !current.includes('|')) break;
    tableLines.push(current);
    index += 1;
  }

  if (tableLines.length < 2 || !isTableSeparator(tableLines[1])) return null;

  const header = splitTableRow(tableLines[0]);
  const body = tableLines.slice(2).map(splitTableRow).filter((row) => row.some(Boolean));

  return { header, body, nextIndex: index };
};

const renderStructuredAnswer = (text = '') => {
  if (!text) return null;

  const blocks = [];
  const lines = text.split(/\n+/);
  let paragraph = [];
  let bulletItems = [];
  let numberedItems = [];
  let activeList = null;
  let index = 0;

  const pushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-3 leading-7 text-slate-700">
        {renderInlineMarkdown(paragraph.join(' '))}
      </p>
    );
    paragraph = [];
  };

  const pushList = () => {
    if (!bulletItems.length && !numberedItems.length) return;

    if (bulletItems.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
          {bulletItems.map((item, itemIndex) => (
            <li key={`ul-item-${itemIndex}`} className="leading-6">{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    }

    if (numberedItems.length) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="mb-4 list-decimal space-y-2 pl-6 text-slate-700">
          {numberedItems.map((item, itemIndex) => (
            <li key={`ol-item-${itemIndex}`} className="leading-6">{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
    }

    bulletItems = [];
    numberedItems = [];
    activeList = null;
  };

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      pushParagraph();
      pushList();
      index += 1;
      continue;
    }

    const table = parseTableAt(lines, index);
    if (table) {
      pushParagraph();
      pushList();
      const { header, body, nextIndex } = table;

      blocks.push(
        <div key={`table-${blocks.length}`} className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="assistant-table w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  {header.map((cell, cellIndex) => (
                    <th key={`th-${cellIndex}`} className="px-4 py-3 font-semibold">{renderInlineMarkdown(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={`tr-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                    {header.map((_, cellIndex) => (
                      <td key={`td-${rowIndex}-${cellIndex}`} className="border-t border-slate-100 px-4 py-3 align-top text-slate-700">
                        {renderInlineMarkdown(row[cellIndex] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

      index = nextIndex;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      pushParagraph();
      pushList();
      const level = (line.match(/^(#+)/)?.[1].length) || 1;
      const headingText = line.replace(/^#+\s*/, '');
      const HeadingTag = level === 1 ? 'h2' : 'h3';
      blocks.push(
        <HeadingTag key={`heading-${blocks.length}`} className={level === 1 ? 'mb-3 mt-5 text-lg font-bold text-slate-900' : 'mb-2 mt-4 text-base font-semibold text-slate-800'}>
          {renderInlineMarkdown(headingText)}
        </HeadingTag>
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      pushParagraph();
      if (activeList !== 'bullet') {
        pushList();
        activeList = 'bullet';
      }
      bulletItems.push(line.replace(/^[-*]\s+/, ''));
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      pushParagraph();
      if (activeList !== 'numbered') {
        pushList();
        activeList = 'numbered';
      }
      numberedItems.push(line.replace(/^\d+\.\s+/, ''));
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      pushParagraph();
      pushList();
      blocks.push(
        <blockquote key={`quote-${blocks.length}`} className="mb-4 rounded-xl border-l-4 border-brand-200 bg-brand-50 px-4 py-3 text-sm italic text-slate-700">
          {renderInlineMarkdown(line.replace(/^>\s?/, ''))}
        </blockquote>
      );
      index += 1;
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  pushParagraph();
  pushList();

  return blocks;
};

export default function Assistant() {
  const { user, config } = useAuth();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setAnswer(null);
    try {
      const { data } = await api.post('/ai/assistant', { query: q });
      setAnswer(data.data);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">AI Placement Assistant</h1>
          <p className="mt-2 text-sm text-slate-500">
            <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link> to ask the assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-brand-600 via-sky-500 to-emerald-400" />
        <div className="p-6 sm:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">AI Placement Assistant</h1>
            <AIBadge />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Answers are grounded in {config.institutionName || 'WCEConnect AI'} content and cite the source blogs. It will not invent college-specific facts.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
        className="card flex gap-3 p-3 shadow-sm"
      >
        <input
          className="input flex-1 border-0 bg-transparent shadow-none focus:ring-0"
          placeholder="Ask a placement question…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary whitespace-nowrap" disabled={loading}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuery(s);
              ask(s);
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {answer && (
        <div className="mt-6 space-y-4">
          <div className="ml-auto max-w-3xl rounded-2xl bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-100">You</div>
            <p className="leading-6">{query}</p>
          </div>

          <div className="mr-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                <AIBadge />
                Structured answer
              </span>
              {!answer.grounded && <span className="badge bg-amber-100 text-amber-700">Insufficient content</span>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="assistant-response">
                {renderStructuredAnswer(answer.answer)}
              </div>
            </div>

            {answer.citations?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">{answer.note}</p>
                <ul className="space-y-2 text-sm">
                  {answer.citations.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">{c.index}</span>
                      <Link to={`/blog/${c.slug}`} className="text-brand-600 underline-offset-2 hover:underline">{c.title}</Link>
                      {c.company && <span className="text-xs text-slate-500">{c.company}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { useRef, useEffect, useState } from 'react';
import { beautifyToHtml } from '../lib/beautify.js';

/* Lightweight WYSIWYG editor — dependency-free (contentEditable + execCommand).
   Formatting (bold, headings, lists) shows live as the student types, and the
   "Auto-format" button cleans spacing/capitalization and structures the text
   into paragraphs/headings without changing the words. Emits sanitized-ready HTML. */

const TOOLS = [
  { cmd: 'bold', label: 'B', title: 'Bold', style: 'font-bold' },
  { cmd: 'italic', label: 'I', title: 'Italic', style: 'italic' },
  { cmd: 'underline', label: 'U', title: 'Underline', style: 'underline' },
  { block: 'H2', label: 'H2', title: 'Heading' },
  { block: 'H3', label: 'H3', title: 'Subheading' },
  { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet list' },
  { cmd: 'formatBlock', arg: 'blockquote', label: '❝', title: 'Quote' },
  { block: 'P', label: '¶', title: 'Paragraph' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Write your experience…' }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  // Sync external value in without clobbering the caret while editing.
  useEffect(() => {
    if (ref.current && !focused && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value, focused]);

  const emit = () => onChange?.(ref.current?.innerHTML || '');

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const applyBlock = (tag) => exec('formatBlock', tag);

  const autoFormat = () => {
    const html = beautifyToHtml(ref.current?.innerHTML || '');
    if (ref.current) ref.current.innerHTML = html;
    onChange?.(html);
  };

  const isEmpty = !value || value === '<br>' || ref.current?.innerText?.trim() === '';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (t.block ? applyBlock(t.block) : exec(t.cmd, t.arg))}
            className={`min-w-8 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-white hover:shadow-sm ${t.style || ''}`}
          >
            {t.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={autoFormat}
          title="Clean spacing, capitalization and structure — keeps your words unchanged"
          className="ml-auto rounded-md bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200"
        >
          ✨ Auto-format
        </button>
      </div>

      {/* Editable area */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">{placeholder}</span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); emit(); }}
          className="rte-content min-h-[340px] max-w-none overflow-y-auto px-4 py-3 text-[15px] leading-relaxed text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}

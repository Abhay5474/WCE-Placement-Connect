import xss from 'xss';

/* Sanitizes user-authored HTML/rich text to prevent stored XSS while allowing
   a safe subset of formatting tags used by the editor. */
const options = {
  whiteList: {
    p: [], br: [], b: [], strong: [], i: [], em: [], u: [], s: [],
    h1: [], h2: [], h3: [], h4: [], blockquote: [], code: [], pre: [],
    ul: [], ol: [], li: [], hr: [],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt'],
    span: [], table: [], thead: [], tbody: [], tr: [], th: [], td: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

export const sanitizeHtml = (html) => xss(String(html || ''), options);

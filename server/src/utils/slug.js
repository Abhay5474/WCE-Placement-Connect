import { nanoid } from 'nanoid';

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'item';

/* Slug guaranteed unique by appending a short id. */
export const uniqueSlug = (text) => `${slugify(text)}-${nanoid(6).toLowerCase()}`;

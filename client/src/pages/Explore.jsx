import { useState } from 'react';
import { useBlogs } from '../lib/hooks.js';
import BlogCard from '../components/BlogCard.jsx';
import { Spinner, EmptyState, Chip } from '../components/ui.jsx';

const CATEGORIES = ['Placement Experience', 'Internship Experience', 'Interview Questions', 'DSA', 'System Design', 'HR Interview', 'Off-Campus', 'On-Campus'];
const SORTS = [['newest', 'Newest'], ['popular', 'Popular'], ['trending', 'Trending'], ['helpful', 'Most helpful']];

export default function Explore() {
  const [filters, setFilters] = useState({ sort: 'newest', category: '', verified: '', page: 1 });
  const { data, isLoading } = useBlogs(filters);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Explore placement content</h1>
      <p className="mb-4 text-sm text-slate-500">Filter by category, sort, or show only verified content.</p>

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip active={!filters.category} onClick={() => set({ category: '' })}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={filters.category === c} onClick={() => set({ category: c })}>{c}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SORTS.map(([v, l]) => (
            <Chip key={v} active={filters.sort === v} onClick={() => set({ sort: v })}>{l}</Chip>
          ))}
          <Chip active={filters.verified === 'true'} onClick={() => set({ verified: filters.verified ? '' : 'true' })}>✓ Verified only</Chip>
        </div>
      </div>

      {isLoading ? <Spinner /> : (data?.data?.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
          {data.meta?.hasMore && (
            <div className="mt-6 text-center">
              <button className="btn-ghost" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Load more</button>
            </div>
          )}
        </>
      ) : <EmptyState title="No blogs match these filters" />)}
    </div>
  );
}

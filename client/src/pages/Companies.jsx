import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanies } from '../lib/hooks.js';
import { Spinner, EmptyState } from '../components/ui.jsx';

export default function Companies() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useCompanies({ q, limit: 50 });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">Explore per-company experiences and preparation insights.</p>
        </div>
        <input className="input max-w-xs" placeholder="Search companies…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? <Spinner /> : (data?.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((c) => (
            <Link key={c._id} to={`/companies/${c.slug}`} className="card p-5 transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 font-bold text-brand-700">
                  {c.logo ? <img src={c.logo} alt="" className="h-11 w-11 rounded-lg object-contain" /> : c.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.industry || 'Company'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{c.experienceCount} experience(s)</span>
                {c.averagePreparationTime && <span className="badge bg-slate-100 text-slate-600">Prep: {c.averagePreparationTime}</span>}
              </div>
              {c.verifiedInformation && <span className="badge mt-2 bg-emerald-100 text-emerald-700">✓ Verified info</span>}
            </Link>
          ))}
        </div>
      ) : <EmptyState title="No companies yet" subtitle="Run the seed script or add companies from the admin panel." />)}
    </div>
  );
}

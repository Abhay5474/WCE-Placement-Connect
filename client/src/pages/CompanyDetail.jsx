import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../lib/hooks.js';
import { api } from '../lib/api.js';
import BlogCard from '../components/BlogCard.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import { Spinner, EmptyState, AIBadge } from '../components/ui.jsx';

export default function CompanyDetail() {
  const { slug } = useParams();
  const { data, isLoading } = useCompany(slug);
  const [showPrep, setShowPrep] = useState(false);

  const prep = useQuery({
    queryKey: ['prep', slug],
    queryFn: () => api.get(`/companies/${slug}/prep-summary`).then((r) => r.data.data),
    enabled: showPrep,
  });

  if (isLoading) return <Spinner />;
  if (!data?.data) return <EmptyState title="Company not found" />;
  const { company, experiences, interviewQuestions, stats } = data.data;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-xl font-bold text-brand-700">
            {company.logo ? <img src={company.logo} alt="" className="h-14 w-14 rounded-xl object-contain" /> : company.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{company.name}</h1>
            <p className="text-sm text-slate-500">{company.industry || 'Company'}</p>
          </div>
        </div>
        {company.description && <p className="mt-4 text-sm text-slate-600">{company.description}</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          <Stat label="Experiences" value={stats.experienceCount} />
          <Stat label="Questions" value={stats.questionCount} />
          {company.averagePreparationTime && <Stat label="Avg prep" value={company.averagePreparationTime} />}
        </div>
        {(company.requiredSkills || []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {company.requiredSkills.map((s) => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}
          </div>
        )}
        <button className="btn-primary mt-4" onClick={() => setShowPrep(true)}>✨ AI preparation summary</button>
      </div>

      {showPrep && (
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2"><h2 className="font-bold">Preparation summary</h2><AIBadge /></div>
          {prep.isLoading ? <Spinner label="Generating…" /> : (
            <>
              <p className="whitespace-pre-line text-sm text-slate-700">{prep.data?.summary}</p>
              <p className="mt-2 text-xs text-slate-400">Grounded in {prep.data?.basedOn ?? 'available'} student experiences. Please verify.</p>
            </>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Frequently asked questions</h2>
        {interviewQuestions?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {interviewQuestions.map((q) => <QuestionCard key={q._id} q={q} />)}
          </div>
        ) : <EmptyState title="No questions extracted yet" />}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Placement experiences</h2>
        {experiences?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {experiences.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        ) : <EmptyState title="No experiences shared yet" subtitle="Be the first to contribute!" />}
      </section>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div><span className="text-lg font-bold text-slate-900">{value}</span><span className="ml-1 text-slate-400">{label}</span></div>
);

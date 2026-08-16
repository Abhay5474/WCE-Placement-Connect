import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth, hasRole } from '../../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../../components/ui.jsx';
import BarChart from '../../components/BarChart.jsx';

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = hasRole(user, 'admin');
  const canManageAccess = hasRole(user, 'admin', 'coordinator');
  const tabs = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Moderation' },
    ...(canManageAccess ? [{ id: 'access', label: 'Access Requests' }] : []),
    ...(isAdmin ? [{ id: 'users', label: 'Users' }, { id: 'companies', label: 'Companies' }] : []),
  ];
  const [tab, setTab] = useState('analytics');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold text-slate-900">Admin &amp; Moderation</h1>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'analytics' && <Analytics />}
      {tab === 'reports' && <Reports />}
      {tab === 'access' && canManageAccess && <AccessRequests />}
      {tab === 'users' && isAdmin && <Users />}
      {tab === 'companies' && isAdmin && <CompanyManager />}
    </div>
  );
}

function Analytics() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => api.get('/admin/analytics').then((r) => r.data.data) });
  if (isLoading) return <Spinner />;
  const { totals, charts } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(totals).map(([k, v]) => (
          <div key={k} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{v}</p>
            <p className="text-xs capitalize text-slate-500">{k.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Blogs by company"><BarChart data={charts.blogsByCompany} /></Panel>
        <Panel title="Contributions by branch"><BarChart data={charts.contributionsByBranch} color="#7c3aed" /></Panel>
        <Panel title="Questions by topic"><BarChart data={charts.questionsByTopic} color="#0891b2" /></Panel>
        <Panel title="Blogs by year"><BarChart data={charts.blogsByYear} color="#059669" /></Panel>
        <Panel title="Common skills"><BarChart data={charts.commonSkills} color="#d97706" /></Panel>
        <Panel title="Search trends"><BarChart data={charts.searchTrends} color="#db2777" /></Panel>
      </div>
    </div>
  );
}

function Reports() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-reports'], queryFn: () => api.get('/admin/reports').then((r) => r.data) });
  if (isLoading) return <Spinner />;
  const resolve = async (id, status, action) => { await api.post(`/admin/reports/${id}/resolve`, { status, action }); refetch(); };
  if (!data.data.length) return <EmptyState title="No reports" subtitle="Reported and AI-flagged content appears here for review." />;
  return (
    <div className="space-y-3">
      {data.data.map((r) => (
        <div key={r._id} className="card p-4">
          <div className="flex items-center justify-between">
            <span className="badge bg-amber-100 text-amber-700">{r.status}</span>
            <span className="text-xs text-slate-400">{r.source} · {new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="mt-2 text-sm"><b>Reason:</b> {r.reason}</p>
          {r.blog && <p className="text-sm text-slate-500">Blog: {r.blog.title}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => resolve(r._id, 'resolved', 'archive_blog')} className="btn-ghost text-sm text-red-600">Archive content</button>
            <button onClick={() => resolve(r._id, 'dismissed')} className="btn-ghost text-sm">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AccessRequests() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['access-requests'], queryFn: () => api.get('/admin/access-requests').then((r) => r.data) });
  if (isLoading) return <Spinner />;
  const decide = async (id, grant) => { await api.patch(`/admin/users/${id}/access`, { grant }); refetch(); };
  if (!data.data.length) return <EmptyState title="No pending requests" subtitle="Users requesting contributor access appear here." />;
  return (
    <div className="space-y-3">
      {data.data.map((u) => (
        <div key={u._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-slate-800">{u.name} <span className="text-xs font-normal text-slate-400">{u.email}</span></p>
            <p className="text-xs text-slate-500">{u.department || '—'} · requested {new Date(u.accessRequest?.requestedAt).toLocaleDateString()}</p>
            {u.accessRequest?.message && <p className="mt-1 text-sm text-slate-600">“{u.accessRequest.message}”</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => decide(u._id, true)} className="btn-primary text-sm">Approve</button>
            <button onClick={() => decide(u._id, false)} className="btn-ghost text-sm text-red-600">Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users', { params: { limit: 50 } }).then((r) => r.data) });
  if (isLoading) return <Spinner />;
  const setRole = async (id, role) => { await api.patch(`/admin/users/${id}/role`, { role }); refetch(); };
  const setActive = async (id, isActive) => { await api.patch(`/admin/users/${id}/active`, { isActive }); refetch(); };
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Active</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {data.data.map((u) => (
            <tr key={u._id}>
              <td className="p-3 font-medium">{u.name} {u.isDemo && <span className="badge bg-slate-100 text-slate-500">demo</span>}</td>
              <td className="p-3 text-slate-500">{u.email}</td>
              <td className="p-3">
                <select className="input py-1" value={u.role} onChange={(e) => setRole(u._id, e.target.value)}>
                  {['student', 'faculty', 'coordinator', 'admin'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </td>
              <td className="p-3">
                <button onClick={() => setActive(u._id, !u.isActive)} className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Disabled'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyManager() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-companies'], queryFn: () => api.get('/companies', { params: { limit: 50 } }).then((r) => r.data) });
  const [form, setForm] = useState({ name: '', industry: '', difficulty: 'Medium' });
  if (isLoading) return <Spinner />;
  const create = async (e) => { e.preventDefault(); await api.post('/companies', form); setForm({ name: '', industry: '', difficulty: 'Medium' }); refetch(); };
  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div><label className="label text-xs">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label text-xs">Industry</label><input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
        <div><label className="label text-xs">Difficulty</label>
          <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <button className="btn-primary">Add company</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((c) => (
          <div key={c._id} className="card p-4"><p className="font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.industry} · {c.difficulty} · {c.experienceCount} exp</p></div>
        ))}
      </div>
    </div>
  );
}

const Panel = ({ title, children }) => (<div className="card p-4"><h3 className="mb-3 font-bold text-slate-800">{title}</h3>{children}</div>);

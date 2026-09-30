import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMessage } from '../../lib/api.js';
import { ErrorNote } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function Register() {
  const { register, config } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', year: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const payload = { ...form, year: form.year ? Number(form.year) : undefined };
      const res = await register(payload);
      if (res.accessToken) navigate('/dashboard');
      else setInfo('Check your email to verify your account before signing in.');
    } catch (err) { setError(errMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join to read and save experiences — anyone can sign up">

      <form onSubmit={submit} className="space-y-3">
        {error && <ErrorNote message={error} />}
        {info && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>}
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">College email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={`you@${config.collegeEmailDomain}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="CSE" />
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              <option value="">—</option>{[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-brand-600">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

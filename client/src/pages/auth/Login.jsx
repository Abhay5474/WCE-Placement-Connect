import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMessage } from '../../lib/api.js';
import { ErrorNote } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard');
    } catch (err) { setError(errMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your WCEConnect AI account">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNote message={error} />}
        <div>
          <label className="label">College email</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@college.edu.in" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-brand-600">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

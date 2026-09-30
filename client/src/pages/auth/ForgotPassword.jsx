import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMessage } from '../../lib/api.js';
import { ErrorNote } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.data.message);
    } catch (err) { setError(errMessage(err)); }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNote message={error} />}
        {msg && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}
        <div>
          <label className="label">College email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn-primary w-full">Send reset link</button>
        <p className="text-center text-sm"><Link to="/login" className="text-brand-600">Back to sign in</Link></p>
      </form>
    </AuthShell>
  );
}

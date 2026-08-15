import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api, errMessage } from '../../lib/api.js';
import { ErrorNote } from '../../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/auth/reset-password', {
        token: params.get('token'), email: params.get('email'), password,
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) { setError(errMessage(err)); }
  };

  return (
    <AuthShell title="Set a new password">
      {done ? (
        <p className="text-emerald-700">✓ Password updated. Redirecting to sign in…</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorNote message={error} />}
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full">Update password</button>
          <p className="text-center text-sm"><Link to="/login" className="text-brand-600">Back to sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}

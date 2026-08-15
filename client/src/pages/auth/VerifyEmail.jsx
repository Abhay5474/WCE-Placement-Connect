import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errMessage } from '../../lib/api.js';
import AuthShell from './AuthShell.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    api.post('/auth/verify-email', { token, email })
      .then(() => setStatus('done'))
      .catch((e) => { setStatus('error'); setMessage(errMessage(e)); });
  }, [params]);

  return (
    <AuthShell title="Email verification">
      {status === 'verifying' && <p className="text-slate-500">Verifying your email…</p>}
      {status === 'done' && (
        <div className="space-y-3">
          <p className="text-emerald-700">✓ Your email is verified.</p>
          <Link to="/login" className="btn-primary">Continue to sign in</Link>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-red-600">{message}</p>
          <Link to="/login" className="btn-ghost">Back to sign in</Link>
        </div>
      )}
    </AuthShell>
  );
}

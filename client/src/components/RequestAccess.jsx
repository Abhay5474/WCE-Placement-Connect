import { useState } from 'react';
import { api, errMessage } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

/* Shown to authenticated readers who don't yet have contributor access.
   They can request it; an admin approves before they can add experiences. */
export default function RequestAccess() {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(user?.accessRequestStatus || 'none');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await api.post('/users/request-access', { message });
      setStatus('pending');
      refreshUser?.();
    } catch (e) { setError(errMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900">Contributor access required</h1>
        <p className="mt-2 text-sm text-slate-500">
          Anyone can read placement experiences without an account. To <b>add</b> your own experience,
          an admin needs to grant you contributor access.
        </p>

        {status === 'pending' ? (
          <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⏳ Your request is pending review. You'll be notified once an admin approves it.
          </div>
        ) : status === 'rejected' ? (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Your previous request was declined. You may submit a new one below.
          </div>
        ) : null}

        {status !== 'pending' && (
          <div className="mt-5 space-y-3 text-left">
            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
            <textarea className="input min-h-[90px]" placeholder="Optional: tell the admin who you are (e.g. batch, branch)…"
              value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={submit} className="btn-primary w-full" disabled={busy}>
              {busy ? 'Submitting…' : 'Request contributor access'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

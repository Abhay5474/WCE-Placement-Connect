import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card p-16 text-center">
      <p className="text-5xl">🤷</p>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-4">Back home</Link>
    </div>
  );
}

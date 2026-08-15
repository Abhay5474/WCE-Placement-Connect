import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, hasRole } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { connectSocket } from '../lib/socket.js';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/placement', label: 'Placement Hub' },
  { to: '/explore', label: 'Explore' },
  { to: '/companies', label: 'Companies' },
  { to: '/interview-questions', label: 'Questions' },
  { to: '/assistant', label: 'AI Assistant' },
];

export default function Layout() {
  const { user, logout, config } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications', { params: { limit: 1 } }).then(({ data }) => setUnread(data.meta?.unread || 0)).catch(() => {});
    const socket = connectSocket();
    socket?.on('notification', () => setUnread((u) => u + 1));
    return () => socket?.off('notification');
  }, [user]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">W</span>
            <span className="hidden sm:block">WCEConnect <span className="text-brand-600">AI</span></span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link to="/create" className="btn-primary hidden sm:inline-flex">Write</Link>
                <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-slate-100" title="Notifications">
                  🔔
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button onClick={() => setMenu((m) => !m)} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                    {user.name?.[0]?.toUpperCase()}
                  </button>
                  {menu && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg" onClick={() => setMenu(false)}>
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <span className="badge mt-1 bg-slate-100 capitalize text-slate-600">{user.role}</span>
                      </div>
                      <MenuLink to="/dashboard">Dashboard</MenuLink>
                      <MenuLink to="/placement/profile">Placement Profile</MenuLink>
                      <MenuLink to="/drafts">My Drafts</MenuLink>
                      <MenuLink to="/saved">Saved Blogs</MenuLink>
                      <MenuLink to="/analytics">My Analytics</MenuLink>
                      {hasRole(user, 'admin', 'coordinator', 'faculty') && <MenuLink to="/admin">Admin / Moderation</MenuLink>}
                      <button onClick={() => { logout(); navigate('/'); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign in</Link>
                <Link to="/register" className="btn-primary">Join</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
        {config.institutionName} · WCEConnect AI — placement knowledge platform ·{' '}
        <span className="text-slate-500">@{config.collegeEmailDomain}</span>
      </footer>
    </div>
  );
}

const MenuLink = ({ to, children }) => (
  <Link to={to} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{children}</Link>
);

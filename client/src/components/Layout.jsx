import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, hasRole } from '../context/AuthContext.jsx';
import { useNotifications } from '../lib/hooks.js';
import { connectSocket } from '../lib/socket.js';
import { BrandLockup } from './ui.jsx';

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
  const location = useLocation();
  const qc = useQueryClient();
  const [menu, setMenu] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  // Shared notifications cache — the bell and the Notifications page read the same
  // query, so marking read updates the badge instantly with no page reload.
  const { data: notifData } = useNotifications({ enabled: !!user });
  const unread = notifData?.meta?.unread || 0;

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    // On a live push, refetch the shared query → badge + list both update.
    const onNotify = () => qc.invalidateQueries({ queryKey: ['notifications'] });
    socket?.on('notification', onNotify);
    return () => socket?.off('notification', onNotify);
  }, [user, qc]);

  useEffect(() => {
    setMenu(false);
    setMobileNav(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link to="/" className="hidden sm:block">
            <BrandLockup institutionName={config.institutionName} compact />
          </Link>
          <Link to="/" className="sm:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">W</span>
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
                  <button
                    onClick={() => setMenu((m) => !m)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700"
                    aria-label="Toggle user menu"
                    aria-expanded={menu}
                  >
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
                      <button
                        type="button"
                        onClick={() => { logout(); navigate('/'); }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
                <Link to="/register" className="btn-primary hidden sm:inline-flex">Join</Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNav((o) => !o)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileNav}
            >
              {mobileNav ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileNav && (
          <nav className="border-t border-slate-100 bg-white px-4 py-2 md:hidden" onClick={() => setMobileNav(false)}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2">
              {user ? (
                <Link to="/create" className="btn-primary flex-1 justify-center">✍ Write</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost flex-1 justify-center">Sign in</Link>
                  <Link to="/register" className="btn-primary flex-1 justify-center">Join</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
        {config.institutionName || 'WCEConnect AI'} — placement knowledge platform ·{' '}
        <span className="text-slate-500">@{config.collegeEmailDomain}</span>
      </footer>
    </div>
  );
}

const MenuLink = ({ to, children }) => (
  <Link to={to} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{children}</Link>
);

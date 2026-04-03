'use client';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { useThemeStore } from '@/lib/store/theme';
import { ROLE_HOME } from '@/lib/token';

export function TopNav() {
  const { user, logout }    = useAuthStore();
  const { theme, toggle }   = useThemeStore();

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <header className="glass border-b border-border sticky top-0 z-30 px-6 py-3 flex items-center justify-between transition-colors">
      <Link
        href={user ? ROLE_HOME[user.role] : '/login'}
        className="font-bold text-lg text-text hover:opacity-70 transition-opacity"
      >
        Delivery
      </Link>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-border transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="text-base leading-none">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
        </button>

        {user && (
          <>
            <span className="text-sm text-subtle hidden sm:block">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-subtle hover:text-text transition-colors"
            >
              Выйти
            </button>
          </>
        )}
      </div>
    </header>
  );
}

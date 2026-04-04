'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bike, Sun, Moon, Languages, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useThemeStore } from '@/lib/store/theme';
import { useLocaleStore } from '@/lib/store/locale';
import { ROLE_HOME } from '@/lib/token';

export function TopNav() {
  const { user, logout }  = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { t, locale, toggle: toggleLocale } = useLocaleStore();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    window.location.href = '/login';
  }

  return (
    <header className="glass border-b border-border sticky top-0 z-30 px-5 py-2.5 flex items-center justify-between">
      {/* Логотип */}
      <Link
        href={user ? ROLE_HOME[user.role] : '/login'}
        className="flex items-center gap-2 group"
      >
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
          <Bike className="w-4 h-4 text-accent-fg" strokeWidth={2} />
        </div>
        <span className="font-bold text-base text-text tracking-tight leading-none">
          {t.nav.brand}
        </span>
      </Link>

      {/* Кнопка настроек */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 h-9 px-3 rounded-xl bg-muted hover:bg-border transition-all duration-200 hover:scale-[1.02] active:scale-95"
        >
          {user
            ? (
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-accent-fg leading-none">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )
            : <Settings className="w-4 h-4 text-subtle" strokeWidth={2} />
          }
          {user && (
            <span className="text-sm font-semibold text-text max-w-[100px] truncate hidden sm:block">
              {user.name}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.5}
          />
        </button>

        {/* Дропдаун */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-theme-lg overflow-hidden animate-scale-in origin-top-right z-50">
            {user && (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-accent-fg leading-none">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{user.name}</p>
                      <p className="text-xs text-subtle">{user.email}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="py-1.5">
              {/* Язык */}
              <button
                onClick={toggleLocale}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Languages className="w-4 h-4 text-subtle" strokeWidth={2} />
                  <span className="text-sm text-text">{t.nav.langName}</span>
                </div>
                <span className="text-xs font-bold text-subtle bg-muted rounded-md px-1.5 py-0.5">
                  {t.nav.langSwitch}
                </span>
              </button>

              {/* Тема */}
              <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'light'
                    ? <Moon className="w-4 h-4 text-subtle" strokeWidth={2} />
                    : <Sun  className="w-4 h-4 text-subtle" strokeWidth={2} />
                  }
                  <span className="text-sm text-text">
                    {theme === 'light' ? t.nav.themeToDark : t.nav.themeToLight}
                  </span>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-accent' : 'bg-border'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow mt-0.5 transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>

            {user && (
              <div className="border-t border-border py-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2} />
                  <span className="text-sm font-medium">{t.nav.logout}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

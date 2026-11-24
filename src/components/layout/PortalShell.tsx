import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { getAppByPath } from '../../registry/apps';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';

export function PortalShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  const currentApp = getAppByPath(pathname);
  const isInternalRoute = pathname.startsWith('/internal');

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    document.title = currentApp ? `${currentApp.title} — Samuel Lopes` : 'Portal de Apps — Samuel Lopes';
  }, [currentApp]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:bg-white print:text-black">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isInternalRoute={isInternalRoute}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="print:hidden sticky top-0 z-30 h-14 px-4 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <Link
                to="/"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                Portal
              </Link>
              {currentApp && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {currentApp.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buscar app</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main
          className={
            currentApp?.immersive
              ? 'flex-1 min-h-[calc(100vh-3.5rem)]'
              : 'flex-1 p-4 sm:p-6 lg:p-8 print:p-0'
          }
        >
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

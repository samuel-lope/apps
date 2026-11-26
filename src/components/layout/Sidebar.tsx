import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Home, ShieldAlert, X } from 'lucide-react';
import { APPS } from '../../registry/apps';
import type { AppManifest } from '../../registry/types';
import { AppIcon } from '../ui/AppIcon';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isInternalRoute: boolean;
}

interface SidebarGroup {
  label: string;
  apps: AppManifest[];
}

const PRIMARY_APP_IDS = new Set(['recibo', 'pix', 'codegen']);

function buildGroups(): SidebarGroup[] {
  const primary = APPS.filter((a) => PRIMARY_APP_IDS.has(a.id));
  const security = APPS.filter((a) => a.category === 'seguranca' && !PRIMARY_APP_IDS.has(a.id));
  const games = APPS.filter((a) => a.category === 'jogos');
  const operationalDev = APPS.filter(
    (a) => a.category === 'operacional' || a.category === 'dev',
  );

  return [
    { label: 'Aplicações Principais', apps: primary },
    { label: 'Segurança & Cripto', apps: security },
    { label: 'Jogos & Experimentos', apps: games },
    { label: 'Operacional & Dev', apps: operationalDev },
  ].filter((group) => group.apps.length > 0);
}

const SIDEBAR_GROUPS = buildGroups();

export function Sidebar({ open, onClose, isInternalRoute }: SidebarProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs print:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Menu lateral"
        className={`print:hidden fixed top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 font-bold text-slate-900 dark:text-white tracking-tight"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-mono">
              SL
            </span>
            <span>Samuel Lopes</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <Link
              to="/"
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              Página Inicial
            </Link>
          </div>

          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.apps.map((app) => {
                  const active = pathname === app.path;
                  return (
                    <li key={app.id}>
                      <Link
                        to={app.path}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-950/60 dark:text-blue-300'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <AppIcon name={app.iconName} className="w-4 h-4 shrink-0" />
                        <span className="truncate">{app.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {isInternalRoute && (
            <div className="px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Área Interna (/internal/*)</span>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>© 2025 Samuel Lopes</span>
          <a
            href="https://github.com/samuel-lope"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
          >
            GitHub
          </a>
        </div>
      </aside>
    </>
  );
}

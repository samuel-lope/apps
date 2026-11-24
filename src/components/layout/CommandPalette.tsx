import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';
import { CATEGORY_LABELS, PUBLIC_APPS } from '../../registry/apps';
import { AppIcon } from '../ui/AppIcon';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PUBLIC_APPS;
    return PUBLIC_APPS.filter(
      (app) =>
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0,
        );
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].path);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-950/60 backdrop-blur-xs print:hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aplicação (ex: pix, recibo, hash, jogo)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Fechar busca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma aplicação encontrada para &ldquo;{query}&rdquo;.
            </li>
          ) : (
            filtered.map((app, index) => (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(app.path);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-200'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${app.accent} text-white flex items-center justify-center shrink-0`}
                  >
                    <AppIcon name={app.iconName} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{app.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {app.description}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    {CATEGORY_LABELS[app.category]}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

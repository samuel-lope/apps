import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { CATEGORY_LABELS, PUBLIC_APPS } from '../registry/apps';
import type { AppCategory } from '../registry/types';
import { AppIcon } from '../components/ui/AppIcon';

type FilterCategory = 'all' | AppCategory;

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'utilitarios', label: CATEGORY_LABELS.utilitarios },
  { value: 'seguranca', label: CATEGORY_LABELS.seguranca },
  { value: 'jogos', label: CATEGORY_LABELS.jogos },
];

export function HomePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');

  const visibleApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PUBLIC_APPS.filter((app) => {
      if (category !== 'all' && app.category !== category) return false;
      if (!q) return true;
      return (
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [search, category]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Web • Cloudflare Workers + Static Assets
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <span>Samuel Lopes</span>
              <span
                className="inline-block w-5 h-1.5 bg-slate-900 dark:bg-slate-100 translate-y-1.5 portal-cursor"
                aria-hidden="true"
              />
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Coleção de utilitários web, ferramentas de criptografia e jogos interativos reunidos em um único portal rápido e responsivo.
            </p>
          </div>

          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar aplicações..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                category === opt.value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {visibleApps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma aplicação corresponde ao filtro atual.
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleApps.map((app) => (
            <Link
              key={app.id}
              to={app.path}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.accent} text-white flex items-center justify-center shadow-xs`}
                  >
                    <AppIcon name={app.iconName} className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>

                <div>
                  <h2 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {app.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {app.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {CATEGORY_LABELS[app.category]}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    app.runtime === 'react'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {app.runtime === 'react' ? 'React' : 'Compat'}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

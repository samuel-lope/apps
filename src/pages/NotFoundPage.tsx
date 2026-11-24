import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-5xl font-bold font-mono text-blue-600 dark:text-blue-400">404</p>
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          O endereço acessado não existe ou foi movido dentro do Portal.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          <Home className="w-4 h-4" /> Voltar ao Portal
        </Link>
      </div>
    </div>
  );
}

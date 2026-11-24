import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  appTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Erro ao carregar {this.props.appTitle || 'aplicação'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {this.state.errorMessage || 'Ocorreu uma falha inesperada.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Recarregar App
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
              >
                <Home className="w-4 h-4" /> Portal
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

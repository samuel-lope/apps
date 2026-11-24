import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppErrorBoundary } from './components/layout/AppErrorBoundary';
import { LegacyAppFrame } from './components/layout/LegacyAppFrame';
import { PortalShell } from './components/layout/PortalShell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { APPS } from './registry/apps';

function AppLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Carregando aplicação...</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <PortalShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {APPS.map((app) => {
          const Component = app.component;
          return (
            <Route
              key={app.id}
              path={app.path}
              element={
                <AppErrorBoundary appTitle={app.title}>
                  {app.runtime === 'react' && Component ? (
                    <Suspense fallback={<AppLoadingFallback />}>
                      <Component />
                    </Suspense>
                  ) : app.legacySrc ? (
                    <LegacyAppFrame
                      src={app.legacySrc}
                      title={app.title}
                      printFriendly={app.printFriendly}
                    />
                  ) : (
                    <NotFoundPage />
                  )}
                </AppErrorBoundary>
              }
            />
          );
        })}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PortalShell>
  );
}

export default App;

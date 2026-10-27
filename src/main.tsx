import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import StudentFoundationGate from './components/StudentFoundationGate';

const ProtectedCBT = lazy(() => import('./components/ProtectedCBT'));
const AdminFoundationGate = lazy(() => import('./components/AdminFoundationGate'));
const AcademicFoundationGate = lazy(() => import('./components/AcademicFoundationGate'));

function WorkspaceLoading({ label }: { label: string }) {
  return <main className="grid min-h-[50vh] place-items-center bg-[#07050d] px-5 text-white"><p role="status" aria-live="polite" aria-atomic="true">{label}</p></main>;
}
import './index.css';

function AppShell() {
  const [cbt, setCbt] = useState(() => new URLSearchParams(window.location.search).get('cbt') === '1');
  const [routeSearch, setRouteSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = () => {
      setRouteSearch(window.location.search);
      setCbt(new URLSearchParams(window.location.search).get('cbt') === '1');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (window.location.pathname === '/admin-academic') {
    return <Suspense fallback={<WorkspaceLoading label="Loading academic workspace…" />}><AcademicFoundationGate /></Suspense>;
  }

  if (window.location.pathname === '/admin' || window.location.pathname === '/admin-import') {
    return <Suspense fallback={<WorkspaceLoading label="Loading admin workspace…" />}><AdminFoundationGate /></Suspense>;
  }

  if (cbt) {
    return (
      <main className="min-h-screen bg-[#07050d] px-5 py-10 text-white">
        <a className="skip-link" href="#cbt-content">Skip to CBT content</a>
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            className="mb-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            onClick={() => { const url = new URL(window.location.href); url.searchParams.delete('cbt'); window.history.pushState({ restoreDashboardFocus: true }, '', url); setCbt(false); }}
          >
            ← Back to ACE JAMB
          </button>
          <div id="cbt-content" tabIndex={-1}>
            <Suspense fallback={<WorkspaceLoading label="Loading CBT session…" />}><ProtectedCBT key={routeSearch} /></Suspense>
          </div>
        </div>
      </main>
    );
  }
  return <StudentFoundationGate />;
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // The app remains fully usable when service-worker installation is unavailable.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);

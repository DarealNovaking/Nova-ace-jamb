import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ProtectedCBT from './components/ProtectedCBT';
import StudentFoundationGate from './components/StudentFoundationGate';
import AdminFoundationGate from './components/AdminFoundationGate';
import AcademicFoundationGate from './components/AcademicFoundationGate';
import './index.css';

function AppShell() {
  const [cbt, setCbt] = useState(() => new URLSearchParams(window.location.search).get('cbt') === '1');

  useEffect(() => {
    const onPopState = () => setCbt(new URLSearchParams(window.location.search).get('cbt') === '1');
    const onNavigate = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      const label = button?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      if (/^(Start CBT|CBT Practice)(\s|$)/i.test(label)) {
        event.preventDefault();
        window.history.pushState({}, '', `${window.location.pathname}?cbt=1`);
        setCbt(true);
      }
    };
    window.addEventListener('popstate', onPopState);
    document.addEventListener('click', onNavigate, true);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onNavigate, true);
    };
  }, []);

  if (window.location.pathname === '/admin-academic') {
    return <AcademicFoundationGate />;
  }

  if (window.location.pathname === '/admin' || window.location.pathname === '/admin-import') {
    return <AdminFoundationGate />;
  }

  if (cbt) {
    return (
      <main className="min-h-screen bg-[#07050d] px-5 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <button
            className="mb-5 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
            onClick={() => { window.history.pushState({}, '', window.location.pathname); setCbt(false); }}
          >
            ← Back to ACE JAMB
          </button>
          <ProtectedCBT />
        </div>
      </main>
    );
  }
  return <StudentFoundationGate />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);

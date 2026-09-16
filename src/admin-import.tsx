import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminCatalogueImport from './components/AdminCatalogueImport';
import './index.css';

function Page(){return <main className="mx-auto max-w-5xl px-5 py-10"><header className="mb-8"><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">ÑØVÃ ACE JAMB</p><h1 className="mt-2 text-4xl font-black">Admin Catalogue Import</h1><p className="mt-2 text-white/50">Secure Batch 2 institution ingestion.</p></header><AdminCatalogueImport/></main>}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Page/></React.StrictMode>);

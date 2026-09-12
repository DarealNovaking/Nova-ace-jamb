import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PersistentCBT from './components/PersistentCBT';
import './index.css';

const persistentCbt = new URLSearchParams(window.location.search).get('cbt') === '1';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {persistentCbt ? <main className="min-h-screen bg-[#07050d] px-5 py-10 text-white"><div className="mx-auto max-w-6xl"><PersistentCBT /></div></main> : <App />}
    </StrictMode>
);

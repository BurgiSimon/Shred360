import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DexieRepository } from './data/dexie/DexieRepository';
import './index.css';

const repository = new DexieRepository();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App repository={repository} />
  </StrictMode>,
);

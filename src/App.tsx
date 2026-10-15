import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RepositoryProvider } from './data/RepositoryContext';
import type { WardrobeRepository } from './data/WardrobeRepository';
import { OutfitEditorPage } from './features/outfits/OutfitEditorPage';
import { OutfitsPage } from './features/outfits/OutfitsPage';
import { SharePage } from './features/share/SharePage';
import { EditItemPage, NewItemPage } from './features/wardrobe/ItemEditorPage';
import { ItemDetailPage } from './features/wardrobe/ItemDetailPage';
import { WardrobePage } from './features/wardrobe/WardrobePage';
import { AppLayout } from './ui/AppLayout';
import { RouteFallback } from './ui/RouteFallback';

// The 3D views pull in three.js, so they load on demand.
const FitCheckPage = lazy(() => import('./features/rider/FitCheckPage'));
const LockerPage = lazy(() => import('./features/locker/LockerPage'));
const SharedOutfitPage = lazy(() => import('./features/share/SharedOutfitPage'));

export function App({ repository }: { repository: WardrobeRepository }) {
  return (
    <RepositoryProvider repository={repository}>
      <HashRouter>
        <Suspense fallback={<RouteFallback label="Loading 3D…" />}>
          <Routes>
            <Route path="/share/:payload" element={<SharedOutfitPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/wardrobe" replace />} />
              <Route path="/wardrobe" element={<WardrobePage />} />
              <Route path="/wardrobe/new" element={<NewItemPage />} />
              <Route path="/wardrobe/:id" element={<ItemDetailPage />} />
              <Route path="/wardrobe/:id/edit" element={<EditItemPage />} />
              <Route path="/outfits" element={<OutfitsPage />} />
              <Route path="/outfits/new" element={<OutfitEditorPage />} />
              <Route path="/outfits/:id" element={<FitCheckPage />} />
              <Route path="/outfits/:id/edit" element={<OutfitEditorPage />} />
              <Route path="/locker" element={<LockerPage />} />
              <Route path="/share" element={<SharePage />} />
              <Route path="*" element={<Navigate to="/wardrobe" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </RepositoryProvider>
  );
}

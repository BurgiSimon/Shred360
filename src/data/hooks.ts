import { useEffect, useMemo, useState } from 'react';
import type { Item, Outfit, Photo } from '@/domain/types';
import { useRepository } from './RepositoryContext';
import type { WardrobeRepository } from './WardrobeRepository';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Runs `query` against the repository and re-runs it whenever the repository reports a write.
 * `key` identifies the query; change it when the query's inputs change.
 */
export function useRepoQuery<T>(
  key: string,
  query: (repo: WardrobeRepository) => Promise<T>,
): QueryState<T> {
  const repo = useRepository();
  const [state, setState] = useState<QueryState<T> & { key: string }>({
    key,
    data: undefined,
    loading: true,
    error: undefined,
  });

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      query(repo).then(
        (data) => !cancelled && setState({ key, data, loading: false, error: undefined }),
        (error: unknown) =>
          !cancelled &&
          setState({
            key,
            data: undefined,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          }),
      );
    };
    run();
    const unsubscribe = repo.subscribe(run);
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // `query` is intentionally keyed by `key` so callers can pass inline functions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, key]);

  // Don't show the previous key's data while the new query is loading.
  if (state.key !== key) return { data: undefined, loading: true, error: undefined };
  return state;
}

export function useItems(): QueryState<Item[]> {
  return useRepoQuery('items', (r) => r.listItems());
}

export function useItem(id: string | undefined): QueryState<Item | undefined> {
  return useRepoQuery(`item:${id ?? ''}`, (r) => (id ? r.getItem(id) : Promise.resolve(undefined)));
}

export function useOutfits(): QueryState<Outfit[]> {
  return useRepoQuery('outfits', (r) => r.listOutfits());
}

export function useOutfit(id: string | undefined): QueryState<Outfit | undefined> {
  return useRepoQuery(`outfit:${id ?? ''}`, (r) =>
    id ? r.getOutfit(id) : Promise.resolve(undefined),
  );
}

export function useItemsById(): Map<string, Item> {
  const { data } = useItems();
  return useMemo(() => new Map((data ?? []).map((i) => [i.id, i])), [data]);
}

/**
 * Object URL for a stored photo, revoked on unmount. Returns undefined while loading or if the
 * photo doesn't exist.
 */
export function usePhotoUrl(
  photoId: string | undefined,
  variant: 'thumb' | 'full' = 'thumb',
): string | undefined {
  const repo = useRepository();
  const [entry, setEntry] = useState<{ key: string; url: string } | undefined>();
  const key = `${photoId ?? ''}:${variant}`;

  useEffect(() => {
    if (!photoId) return;
    let url: string | undefined;
    let cancelled = false;
    repo.getPhoto(photoId).then((photo: Photo | undefined) => {
      if (cancelled || !photo) return;
      url = URL.createObjectURL(photo[variant]);
      setEntry({ key, url });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [repo, photoId, variant, key]);

  return entry?.key === key ? entry.url : undefined;
}

/** Object URLs for several photos at once (thumb size), keyed by photo id. */
export function usePhotoUrls(photoIds: string[]): Record<string, string> {
  const repo = useRepository();
  const key = photoIds.join(',');
  const [entry, setEntry] = useState<{ key: string; urls: Record<string, string> }>();

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    let cancelled = false;
    const created: string[] = [];
    Promise.all(ids.map((id) => repo.getPhoto(id))).then((photos) => {
      if (cancelled) return;
      const urls: Record<string, string> = {};
      photos.forEach((photo, i) => {
        if (!photo) return;
        const url = URL.createObjectURL(photo.thumb);
        created.push(url);
        urls[ids[i]] = url;
      });
      setEntry({ key, urls });
    });
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [repo, key]);

  return entry?.key === key ? entry.urls : EMPTY_URLS;
}

const EMPTY_URLS: Record<string, string> = {};

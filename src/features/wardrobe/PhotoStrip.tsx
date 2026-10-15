import { useRef, useState } from 'react';
import { useRepository } from '@/data/RepositoryContext';
import type { Photo } from '@/domain/types';
import { processImageFile } from '@/media/imageProcessing';
import { CameraIcon, PlusIcon, StarIcon, TrashIcon } from '@/ui/icons';
import { PhotoImage } from '@/ui/PhotoImage';

/**
 * Photo list editor. New photos are processed and stored immediately (so they survive a reload of
 * the form) and reported through `onAdded`; the form is responsible for cleaning up photos that
 * end up unused.
 */
export function PhotoStrip({
  photoIds,
  coverPhotoId,
  onAdded,
  onRemove,
  onSetCover,
}: {
  photoIds: string[];
  coverPhotoId?: string;
  onAdded: (photos: Photo[]) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
}) {
  const repo = useRepository();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string>();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    setBusy((n) => n + list.length);
    const added: Photo[] = [];
    for (const file of list) {
      try {
        added.push(await repo.addPhoto(await processImageFile(file)));
      } catch (e) {
        console.error(e);
        setError(`Couldn't read ${file.name || 'that photo'}. Try a JPEG or PNG.`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onAdded(added);
  }

  const cover = coverPhotoId ?? photoIds[0];

  return (
    <div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {photoIds.map((id) => (
          <div
            key={id}
            className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-ink-600"
          >
            <PhotoImage photoId={id} alt="Item photo" className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink-950/90 p-1">
              <button
                type="button"
                onClick={() => onSetCover(id)}
                aria-label={id === cover ? 'Cover photo' : 'Use as cover photo'}
                className={`rounded-md p-1 ${id === cover ? 'text-yellow-300' : 'text-white/70 hover:text-white'}`}
              >
                <StarIcon className="size-4" fill={id === cover ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(id)}
                aria-label="Remove photo"
                className="rounded-md p-1 text-white/70 hover:text-red-300"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div
            key={`busy-${i}`}
            className="flex size-28 shrink-0 items-center justify-center rounded-xl border border-ink-600 bg-ink-800"
            role="status"
            aria-label="Processing photo"
          >
            <span className="size-6 animate-spin rounded-full border-2 border-ink-600 border-t-ice" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-600 text-ink-200 hover:border-ice hover:text-white"
        >
          <CameraIcon className="size-7" />
          <span className="text-xs font-semibold">Take photo</span>
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          className="flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-600 text-ink-200 hover:border-ice hover:text-white"
        >
          <PlusIcon className="size-7" />
          <span className="text-xs font-semibold">From gallery</span>
        </button>
      </div>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="photo-camera-input"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        data-testid="photo-gallery-input"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  );
}

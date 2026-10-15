import { useEffect, useState } from 'react';
import {
  shareLink,
  shareOrDownload,
  slugify,
  snapshotCanvas,
  type Caption,
} from '@/share/snapshot';
import { canRecordVideo, startRecording, videoExtension } from '@/share/turntable';
import { Button } from '@/ui/Button';

type Busy = 'image' | 'video' | 'link' | null;

export const TURNTABLE_SECONDS = 6;

/**
 * Bottom sheet with the three ways to share a 3D view: a link (outfits only), a captioned
 * image of the current frame, and a 360° turntable video.
 */
export function SharePanel({
  caption,
  getCanvas,
  link,
  onTurntable,
  onClose,
}: {
  caption: Caption;
  getCanvas: () => HTMLCanvasElement | null;
  /** Full share URL; omitted where there's nothing to link to (e.g. the locker). */
  link?: string;
  /** Spins the camera once and resolves when done; enables video recording. */
  onTurntable?: (seconds: number, onProgress: (t: number) => void) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState<string>();
  const [progress, setProgress] = useState(0);
  const videoSupported = Boolean(onTurntable) && canRecordVideo();
  const fileBase = `shred360-${slugify(caption.title)}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function run(kind: Exclude<Busy, null>, task: () => Promise<string | undefined>) {
    setBusy(kind);
    setStatus(undefined);
    try {
      setStatus(await task());
    } catch (e) {
      console.error(e);
      setStatus(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
      setProgress(0);
    }
  }

  const handleLink = () =>
    run('link', async () => {
      const result = await shareLink(link!, {
        title: caption.title,
        text: 'Check out my fit on Shred360',
      });
      return result === 'copied'
        ? 'Link copied to the clipboard.'
        : result === 'shared'
          ? 'Shared!'
          : undefined;
    });

  const handleImage = () =>
    run('image', async () => {
      const canvas = getCanvas();
      if (!canvas) throw new Error('The 3D view is not ready yet.');
      const blob = await snapshotCanvas(canvas, caption);
      const result = await shareOrDownload(blob, `${fileBase}.png`, { title: caption.title });
      return result === 'downloaded'
        ? 'Image saved to your downloads.'
        : result === 'shared'
          ? 'Shared!'
          : undefined;
    });

  const handleVideo = () =>
    run('video', async () => {
      const canvas = getCanvas();
      if (!canvas || !onTurntable) throw new Error('The 3D view is not ready yet.');
      const recording = startRecording(canvas, caption);
      try {
        await onTurntable(TURNTABLE_SECONDS, setProgress);
      } catch (e) {
        await recording.stop();
        throw e;
      }
      const blob = await recording.stop();
      const result = await shareOrDownload(blob, `${fileBase}-360.${videoExtension(blob.type)}`, {
        title: caption.title,
      });
      return result === 'downloaded'
        ? 'Video saved to your downloads.'
        : result === 'shared'
          ? 'Shared!'
          : undefined;
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        className="safe-bottom w-full rounded-t-3xl border border-ink-700 bg-ink-900 p-5 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Share “{caption.title}”</h2>
            <p className="text-xs text-ink-400">
              Photos stay on your device unless you send an image or video.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            className="px-2 text-2xl text-ink-400 hover:text-white disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid gap-2">
          {link && (
            <ShareOption
              icon="🔗"
              title="Share link"
              detail="Opens your outfit in 3D — colours, brands and names, no photos."
              onClick={handleLink}
              disabled={Boolean(busy)}
              busy={busy === 'link'}
            />
          )}
          <ShareOption
            icon="📸"
            title="Snapshot"
            detail="Save the current 3D view as an image."
            onClick={handleImage}
            disabled={Boolean(busy)}
            busy={busy === 'image'}
          />
          {videoSupported && (
            <ShareOption
              icon="🎥"
              title="360° video"
              detail={`Record a ${TURNTABLE_SECONDS}-second spin around the rider.`}
              onClick={handleVideo}
              disabled={Boolean(busy)}
              busy={busy === 'video'}
            />
          )}
        </div>

        {busy === 'video' && (
          <div
            className="mt-4"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-2 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-glow transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-400">Recording… keep this tab open.</p>
          </div>
        )}
        {status && (
          <p className="mt-4 rounded-xl bg-ice/10 px-3 py-2 text-sm text-ice" role="status">
            {status}
          </p>
        )}
        <Button variant="ghost" className="mt-3 w-full" onClick={onClose} disabled={Boolean(busy)}>
          Done
        </Button>
      </div>
    </div>
  );
}

function ShareOption({
  icon,
  title,
  detail,
  onClick,
  disabled,
  busy,
}: {
  icon: string;
  title: string;
  detail: string;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="card flex items-center gap-3 p-3 text-left transition hover:border-ice/60 disabled:opacity-60"
    >
      <span className="text-2xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-white">{title}</span>
        <span className="block text-xs text-ink-400">{detail}</span>
      </span>
      {busy && (
        <span className="size-5 animate-spin rounded-full border-2 border-ink-600 border-t-ice" />
      )}
    </button>
  );
}

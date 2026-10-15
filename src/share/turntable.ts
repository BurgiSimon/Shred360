import { drawCaption, type Caption } from './snapshot';

/**
 * Records a 3D canvas to a video while the camera spins once around the rider. We draw each
 * frame into a 2D canvas (to add the caption and cap the resolution) and record that canvas.
 */

const CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export function pickVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function canRecordVideo(): boolean {
  return (
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype &&
    pickVideoMimeType() !== undefined
  );
}

export function videoExtension(mime: string): string {
  return mime.startsWith('video/mp4') ? 'mp4' : 'webm';
}

export interface Recording {
  /** Resolves with the video once `stop()` is called. */
  stop: () => Promise<Blob>;
}

export function startRecording(
  source: HTMLCanvasElement,
  caption: Caption,
  { fps = 30, maxSize = 1080 }: { fps?: number; maxSize?: number } = {},
): Recording {
  const mimeType = pickVideoMimeType();
  if (!mimeType) throw new Error('Video recording is not supported in this browser.');
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  // Even dimensions keep H.264 encoders happy.
  canvas.width = Math.round((source.width * scale) / 2) * 2;
  canvas.height = Math.round((source.height * scale) / 2) * 2;
  const ctx = canvas.getContext('2d')!;

  let frame = 0;
  const draw = () => {
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    drawCaption(ctx, canvas.width, canvas.height, caption);
    frame = requestAnimationFrame(draw);
  };
  draw();

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.start(250);

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          cancelAnimationFrame(frame);
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
        };
        recorder.stop();
      }),
  };
}

import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** "Install app" button where the browser supports it (Chrome/Edge/Android). */
function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  if (!event) return undefined;
  return async () => {
    await event.prompt();
    await event.userChoice;
    setEvent(null);
  };
}

export function InstallButton({ className = '' }: { className?: string }) {
  const install = useInstallPrompt();
  if (!install) return null;
  return (
    <button
      type="button"
      onClick={() => void install()}
      className={`rounded-xl border border-ice/40 bg-ice/10 px-3 py-2 text-sm font-semibold text-ice hover:bg-ice/20 ${className}`}
    >
      ⬇ Install app
    </button>
  );
}

/** Toasts for "new version available" and "ready to work offline". */
export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;
  return (
    <div
      role="status"
      className="card fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-3 p-3 sm:bottom-6"
    >
      <p className="flex-1 text-sm text-white">
        {needRefresh ? 'A new version of Shred360 is ready.' : 'Shred360 now works offline.'}
      </p>
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="rounded-lg bg-ice px-3 py-1.5 text-sm font-semibold text-ink-950"
        >
          Reload
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
        className="px-1 text-xl text-ink-400 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { backupFileName, exportBackup, importBackup } from '@/data/backup';
import { useItems, useOutfits } from '@/data/hooks';
import { useRepository } from '@/data/RepositoryContext';
import { lookFromResolved } from '@/domain/outfitLook';
import { outfitItemCount, resolveOutfit } from '@/domain/outfits';
import { DISCIPLINES, type Item, type Outfit } from '@/domain/types';
import { encodeOutfit, shareUrl } from '@/share/outfitLink';
import { downloadBlob, shareLink } from '@/share/snapshot';
import { Button } from '@/ui/Button';
import { PageHeader } from '@/ui/PageHeader';
import { FlatRider } from '../outfits/FlatRider';

export function SharePage() {
  return (
    <>
      <PageHeader title="Share & backup" subtitle="Send your fits, keep your wardrobe safe" />
      <div className="space-y-8 px-4 pb-10 sm:px-6">
        <OutfitLinks />
        <Backup />
        <StorageInfo />
      </div>
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xs font-bold tracking-widest text-ink-400 uppercase">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-ink-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function OutfitLinks() {
  const { data: outfits } = useOutfits();
  const { data: items } = useItems();
  if (!outfits?.length) {
    return (
      <Section
        title="Outfit links"
        hint="Build an outfit to get a 3D link you can send to friends."
      >
        <Link to="/outfits/new" className="text-sm font-semibold text-ice hover:underline">
          Build an outfit →
        </Link>
      </Section>
    );
  }
  return (
    <Section
      title="Outfit links"
      hint="Links open your outfit in 3D on any device. They contain colours, names and brands — never your photos."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {outfits.map((o) => (
          <OutfitLinkRow key={o.id} outfit={o} items={items ?? []} />
        ))}
      </ul>
    </Section>
  );
}

function OutfitLinkRow({ outfit, items }: { outfit: Outfit; items: Item[] }) {
  const [status, setStatus] = useState<string>();
  const look = lookFromResolved(resolveOutfit(outfit, items));
  const name = outfit.name || 'Untitled outfit';
  const discipline = DISCIPLINES.find((d) => d.id === outfit.discipline);

  async function handleShare() {
    const url = shareUrl(
      encodeOutfit({ name, discipline: outfit.discipline, conditions: outfit.conditions, look }),
    );
    const result = await shareLink(url, { title: name, text: 'Check out my fit on Shred360' });
    setStatus(result === 'copied' ? 'Link copied!' : result === 'shared' ? 'Shared!' : undefined);
    window.setTimeout(() => setStatus(undefined), 2500);
  }

  return (
    <li className="card flex items-center gap-3 p-2.5">
      <div className="flex w-12 shrink-0 justify-center rounded-lg bg-ink-700/60">
        <FlatRider look={look} className="h-16 w-auto" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={`/outfits/${outfit.id}`}
          className="block truncate font-semibold text-white hover:underline"
        >
          {name}
        </Link>
        <p className="text-xs text-ink-400">
          {discipline?.icon} {outfitItemCount(outfit)} pieces
        </p>
      </div>
      <Button
        variant={status ? 'secondary' : 'primary'}
        onClick={handleShare}
        className="!px-3 !py-2"
      >
        {status ?? 'Share link'}
      </Button>
    </li>
  );
}

function Backup() {
  const repo = useRepository();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();

  async function handleExport() {
    setBusy('export');
    setMessage(undefined);
    try {
      downloadBlob(await exportBackup(repo), backupFileName());
      setMessage({
        tone: 'ok',
        text: 'Backup downloaded. Keep it somewhere safe (cloud drive, email to yourself…).',
      });
    } catch (e) {
      console.error(e);
      setMessage({ tone: 'error', text: 'Export failed.' });
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    const replace = window.confirm(
      'Replace your current wardrobe with this backup?\n\nOK = replace everything\nCancel = merge (keep current items, add/update from the backup)',
    );
    setBusy('import');
    setMessage(undefined);
    try {
      const counts = await importBackup(repo, file, replace ? 'replace' : 'merge');
      setMessage({
        tone: 'ok',
        text: `${replace ? 'Restored' : 'Merged'} ${counts.items} items, ${counts.outfits} outfits and ${counts.photos} photos.`,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : 'Import failed.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Section
      title="Backup"
      hint="Your wardrobe lives only in this browser. Export a backup file to move it to another device or keep it safe."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={handleExport} disabled={Boolean(busy)}>
          {busy === 'export' ? 'Exporting…' : 'Export wardrobe (.zip)'}
        </Button>
        <Button onClick={() => fileInput.current?.click()} disabled={Boolean(busy)}>
          {busy === 'import' ? 'Importing…' : 'Import backup'}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          data-testid="backup-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleImport(file);
          }}
        />
      </div>
      {message && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-sm ${
            message.tone === 'ok' ? 'bg-ice/10 text-ice' : 'bg-red-500/10 text-red-300'
          }`}
        >
          {message.text}
        </p>
      )}
    </Section>
  );
}

function StorageInfo() {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number }>();
  const [persisted, setPersisted] = useState<boolean>();

  useEffect(() => {
    void navigator.storage
      ?.estimate?.()
      .then((e) => setEstimate({ usage: e.usage ?? 0, quota: e.quota ?? 0 }));
    void navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n > 100 * 1024 * 1024 ? 0 : 1)} MB`;

  return (
    <Section title="Storage on this device">
      <div className="card space-y-3 p-4 text-sm">
        {estimate && (
          <p>
            Using <span className="font-semibold text-white">{mb(estimate.usage)}</span>
            {estimate.quota > 0 && <> of about {mb(estimate.quota)} available.</>}
          </p>
        )}
        {persisted === false && navigator.storage?.persist && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-ink-400">
              Browsers may clear site data when space runs low. Ask to keep your wardrobe
              permanently:
            </p>
            <Button onClick={() => void navigator.storage.persist().then(setPersisted)}>
              Keep my data
            </Button>
          </div>
        )}
        {persisted && <p className="text-ice">✓ This browser will keep your wardrobe data.</p>}
        <p className="text-xs text-ink-400">
          Shred360 is local-first: no account, no server. Cloud sync can be added later.
        </p>
      </div>
    </Section>
  );
}

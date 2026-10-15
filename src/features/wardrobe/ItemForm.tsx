import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRepository } from '@/data/RepositoryContext';
import { CATEGORIES, getCategory, isCategoryId } from '@/domain/categories';
import { itemCoverPhotoId, normalizeHex, parseTags, validateItem } from '@/domain/items';
import { FINISHES, ITEM_CONDITIONS, PATTERNS, type Item, type Photo } from '@/domain/types';
import { extractPaletteFromBlob } from '@/media/colorExtract';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ColorRolesField } from './ColorRolesField';
import { PhotoStrip } from './PhotoStrip';
import { SpecFields } from './SpecFields';

export function ItemForm({
  initial,
  isNew,
  onSaved,
  onCancel,
}: {
  initial: Item;
  isNew: boolean;
  onSaved: (item: Item) => void;
  onCancel: () => void;
}) {
  const repo = useRepository();
  const [draft, setDraft] = useState<Item>(initial);
  const [tagText, setTagText] = useState(initial.tags.join(', '));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<ReturnType<typeof validateItem>['errors']>({});
  const [saving, setSaving] = useState(false);
  // Until the user picks colours by hand, the first photo's palette is applied automatically.
  const colorsTouched = useRef(!isNew);

  // Photos uploaded in this session that haven't been saved yet, and saved photos the user
  // removed. Both are reconciled on save / cancel so we don't leak blobs into IndexedDB.
  const addedPhotos = useRef(new Set<string>());
  const removedPhotos = useRef(new Set<string>());
  const saved = useRef(false);

  useEffect(() => {
    const added = addedPhotos.current;
    return () => {
      if (!saved.current) for (const id of added) void repo.deletePhoto(id);
    };
  }, [repo]);

  const category = getCategory(draft.categoryId);

  function update(patch: Partial<Item>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function handlePhotosAdded(photos: Photo[]) {
    for (const p of photos) addedPhotos.current.add(p.id);
    setDraft((d) => ({ ...d, photoIds: [...d.photoIds, ...photos.map((p) => p.id)] }));
    try {
      const palette = await extractPaletteFromBlob(photos[0].thumb, { count: 4 });
      const hexes = palette.map((p) => p.hex);
      setSuggestions(hexes);
      if (!colorsTouched.current && hexes.length) {
        setDraft((d) => ({
          ...d,
          colors: { primary: hexes[0], ...(hexes[1] ? { secondary: hexes[1] } : {}) },
        }));
      }
    } catch (e) {
      console.warn('Colour extraction failed', e);
    }
  }

  function handleRemovePhoto(id: string) {
    if (addedPhotos.current.has(id)) {
      addedPhotos.current.delete(id);
      void repo.deletePhoto(id);
    } else {
      removedPhotos.current.add(id);
    }
    setDraft((d) => ({
      ...d,
      photoIds: d.photoIds.filter((p) => p !== id),
      coverPhotoId: d.coverPhotoId === id ? undefined : d.coverPhotoId,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const item: Item = {
      ...draft,
      tags: parseTags(tagText),
      colors: {
        primary: normalizeHex(draft.colors.primary) ?? draft.colors.primary,
        ...(normalizeHex(draft.colors.secondary)
          ? { secondary: normalizeHex(draft.colors.secondary) }
          : {}),
        ...(normalizeHex(draft.colors.accent) ? { accent: normalizeHex(draft.colors.accent) } : {}),
      },
    };
    item.coverPhotoId = itemCoverPhotoId(item);
    const result = validateItem(item);
    setErrors(result.errors);
    if (!result.ok) return;
    setSaving(true);
    try {
      const savedItem = await repo.saveItem(item);
      saved.current = true;
      for (const id of removedPhotos.current) await repo.deletePhoto(id);
      onSaved(savedItem);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-10 sm:px-6" noValidate>
      <Section
        title="Photos"
        hint="Lay it flat or hang it up. A plain background gives better colours."
      >
        <PhotoStrip
          photoIds={draft.photoIds}
          coverPhotoId={draft.coverPhotoId}
          onAdded={handlePhotosAdded}
          onRemove={handleRemovePhoto}
          onSetCover={(id) => update({ coverPhotoId: id })}
        />
      </Section>

      <Section title="Basics">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g. My orange powder jacket"
            />
          </Field>
          <Field label="Category" error={errors.category}>
            <select
              value={draft.categoryId}
              onChange={(e) => {
                if (isCategoryId(e.target.value)) update({ categoryId: e.target.value, specs: {} });
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <input
              value={draft.brand}
              onChange={(e) => update({ brand: e.target.value })}
              placeholder="e.g. Burton"
            />
          </Field>
          <Field label="Model">
            <input
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder="e.g. [ak] Cyclic"
            />
          </Field>
          <Field label="Size">
            <input
              value={draft.size}
              onChange={(e) => update({ size: e.target.value })}
              placeholder="e.g. M, 54-58 cm"
            />
          </Field>
          <Field label="Condition">
            <select
              value={draft.condition}
              onChange={(e) => update({ condition: e.target.value as Item['condition'] })}
            >
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Look" hint="These drive how the item looks on your 3D rider.">
        <ColorRolesField
          colors={draft.colors}
          roles={
            category?.colorRoles ?? { primary: 'Main', secondary: 'Secondary', accent: 'Accent' }
          }
          suggestions={suggestions}
          onChange={(colors) => {
            colorsTouched.current = true;
            update({ colors });
          }}
        />
        {errors.colors && <p className="text-sm text-red-300">{errors.colors}</p>}
        <div className="flex flex-wrap gap-2">
          {PATTERNS.map((p) => (
            <Chip
              key={p.id}
              active={draft.pattern === p.id}
              onClick={() => update({ pattern: p.id })}
            >
              {p.label}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-ink-700" />
          {FINISHES.map((f) => (
            <Chip
              key={f.id}
              active={draft.finish === f.id}
              onClick={() => update({ finish: f.id })}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </Section>

      {category && category.specs.length > 0 && (
        <Section title="Specs">
          <SpecFields
            fields={category.specs}
            values={draft.specs}
            onChange={(specs) => update({ specs })}
          />
        </Section>
      )}

      <Section title="Details">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Bought on">
            <input
              type="date"
              value={draft.purchase.date ?? ''}
              onChange={(e) =>
                update({ purchase: { ...draft.purchase, date: e.target.value || undefined } })
              }
            />
          </Field>
          <Field label="Price">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className="min-w-0 flex-1"
                value={draft.purchase.price ?? ''}
                onChange={(e) =>
                  update({
                    purchase: {
                      ...draft.purchase,
                      price: e.target.value === '' ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
              <input
                aria-label="Currency"
                className="w-20"
                maxLength={3}
                placeholder="CHF"
                value={draft.purchase.currency ?? ''}
                onChange={(e) =>
                  update({
                    purchase: {
                      ...draft.purchase,
                      currency: e.target.value.toUpperCase() || undefined,
                    },
                  })
                }
              />
            </div>
          </Field>
          <Field label="Shop">
            <input
              value={draft.purchase.store ?? ''}
              onChange={(e) =>
                update({ purchase: { ...draft.purchase, store: e.target.value || undefined } })
              }
            />
          </Field>
        </div>
        <Field label="Tags" hint="Comma separated, e.g. backcountry, favourite">
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </Field>
      </Section>

      <div className="safe-bottom sticky bottom-20 z-20 flex gap-3 rounded-2xl border border-ink-700 bg-ink-900/95 p-3 backdrop-blur sm:bottom-4">
        <Button variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : isNew ? 'Add to wardrobe' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xs font-bold tracking-widest text-ink-400 uppercase">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
      {error && <span className="text-sm text-red-300">{error}</span>}
    </label>
  );
}

import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import { createItem } from '@/domain/items';
import { lookFromResolved } from '@/domain/outfitLook';
import {
  decodeOutfit,
  encodeOutfit,
  shareUrl,
  ShareLinkError,
  type SharedOutfit,
} from './outfitLink';

const jacket = createItem('shellJacket', {
  brand: 'Burton',
  model: '[ak] Cyclic',
  colors: { primary: '#ff7a00', secondary: '#1a255f' },
  pattern: 'colorBlock',
  finish: 'sheen',
});
const goggles = createItem('goggles', {
  brand: 'Oakley',
  colors: { primary: '#ffffff', accent: '#ff5500' },
});

const outfit: SharedOutfit = {
  name: 'Pow day',
  discipline: 'snowboard',
  conditions: ['powder', 'cold'],
  look: lookFromResolved({ shellTop: jacket, eyes: goggles }),
};

const encodeRaw = (value: unknown) => compressToEncodedURIComponent(JSON.stringify(value));

describe('outfit share links', () => {
  it('round-trips an outfit without local ids', () => {
    const decoded = decodeOutfit(encodeOutfit(outfit));
    expect(decoded.name).toBe('Pow day');
    expect(decoded.discipline).toBe('snowboard');
    expect(decoded.conditions).toEqual(['powder', 'cold']);
    expect(decoded.look.shellTop).toMatchObject({
      categoryId: 'shellJacket',
      garment: 'jacket',
      label: 'Burton [ak] Cyclic',
      brand: 'Burton',
      colors: { primary: '#ff7a00', secondary: '#1a255f' },
      pattern: 'colorBlock',
      finish: 'sheen',
    });
    expect(decoded.look.shellTop?.itemId).toBeUndefined();
    expect(decoded.look.eyes?.colors).toEqual({ primary: '#ffffff', accent: '#ff5500' });
  });

  it('produces URL-safe payloads of reasonable size', () => {
    const encoded = encodeOutfit(outfit);
    expect(encoded).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(encoded.length).toBeLessThan(400);
    expect(shareUrl(encoded, { origin: 'https://x.dev', pathname: '/Shred360/' })).toBe(
      `https://x.dev/Shred360/#/share/${encoded}`,
    );
  });

  it('clips very long text', () => {
    const long = { ...outfit, name: 'x'.repeat(500) };
    expect(decodeOutfit(encodeOutfit(long)).name).toHaveLength(80);
  });

  it.each([
    ['garbage', 'not-a-payload'],
    ['wrong version', encodeRaw({ v: 99, n: 'a', d: 'ski', c: [], s: {} })],
    ['bad discipline', encodeRaw({ v: 1, n: 'a', d: 'sled', c: [], s: {} })],
    [
      'unknown slot',
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: [],
        s: { tail: ['helmet', '', '', '#000', '', '', 'solid', 'matte'] },
      }),
    ],
    [
      'category in wrong slot',
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: [],
        s: { head: ['gloves', '', '', '#000', '', '', 'solid', 'matte'] },
      }),
    ],
    [
      'bad colour',
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: [],
        s: { head: ['helmet', '', '', 'red', '', '', 'solid', 'matte'] },
      }),
    ],
    [
      'script in colour',
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: [],
        s: { head: ['helmet', '', '', '<script>', '', '', 'solid', 'matte'] },
      }),
    ],
    [
      'bad pattern',
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: [],
        s: { head: ['helmet', '', '', '#000', '', '', 'plaid', 'matte'] },
      }),
    ],
    ['short tuple', encodeRaw({ v: 1, n: 'a', d: 'ski', c: [], s: { head: ['helmet'] } })],
  ])('rejects %s', (_, payload) => {
    expect(() => decodeOutfit(payload)).toThrow(ShareLinkError);
  });

  it('drops unknown condition tags and invalid optional colours', () => {
    const decoded = decodeOutfit(
      encodeRaw({
        v: 1,
        n: 'a',
        d: 'ski',
        c: ['powder', 'lava'],
        s: { head: ['helmet', 'Lid', 'Smith', '#000', 'nope', '#fff', 'solid', 'matte'] },
      }),
    );
    expect(decoded.conditions).toEqual(['powder']);
    expect(decoded.look.head?.colors).toEqual({ primary: '#000000', accent: '#ffffff' });
  });
});

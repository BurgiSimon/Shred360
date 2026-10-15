import { describe, expect, it } from 'vitest';
import { lookFromResolved, outermostBottom, outermostTop } from '@/domain/outfitLook';
import { createItem } from '@/domain/items';
import { layerFade, peelScale } from './rig';

describe('layer peel', () => {
  it('peels shells first, then mid-layers', () => {
    expect(layerFade(0, 'outer')).toBe(0);
    expect(layerFade(0.5, 'outer')).toBe(0.5);
    expect(layerFade(0.5, 'mid')).toBe(0);
    expect(layerFade(1.5, 'outer')).toBe(1);
    expect(layerFade(1.5, 'mid')).toBe(0.5);
    expect(layerFade(2, 'mid')).toBe(1);
  });

  it('expands peeled layers outwards', () => {
    expect(peelScale(0)).toBe(1);
    expect(peelScale(1)).toBeGreaterThan(1);
  });
});

describe('outfit look', () => {
  it('maps items to garments and finds the outermost visible layers', () => {
    const jacket = createItem('insulatedJacket', {
      brand: 'Patagonia',
      colors: { primary: '#ff0000' },
    });
    const base = createItem('baseTop', { brand: 'Icebreaker' });
    const bibs = createItem('bibs', { brand: 'Burton' });
    const look = lookFromResolved({ shellTop: jacket, baseTop: base, shellBottom: bibs });
    expect(look.shellTop?.garment).toBe('puffy');
    expect(look.shellTop?.label).toBe('Patagonia');
    expect(look.shellBottom?.garment).toBe('bibs');
    expect(outermostTop(look)?.itemId).toBe(jacket.id);
    expect(outermostTop({ baseTop: look.baseTop })?.itemId).toBe(base.id);
    expect(outermostBottom({})).toBeUndefined();
  });
});

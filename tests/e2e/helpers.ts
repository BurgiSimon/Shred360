import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const fixture = (name: string) => path.join(here, 'fixtures', name);

export async function addItem(
  page: Page,
  {
    category,
    photo,
    brand,
    model,
  }: { category: string; photo?: string; brand: string; model: string },
) {
  await page.goto(`/#/wardrobe/new?category=${category}`);
  if (photo) {
    await page.getByTestId('photo-gallery-input').setInputFiles(fixture(photo));
    await expect(page.getByTestId('color-suggestions')).toBeVisible();
  }
  await page.getByLabel('Brand').fill(brand);
  await page.getByLabel('Model').fill(model);
  await page.getByRole('button', { name: 'Add to wardrobe' }).click();
  await expect(page).toHaveURL(/#\/wardrobe\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${brand} ${model}`);
}

export async function seedBasics(page: Page) {
  await addItem(page, {
    category: 'shellJacket',
    photo: 'jacket.jpg',
    brand: 'Burton',
    model: 'Cyclic',
  });
  await addItem(page, { category: 'pants', photo: 'pants.jpg', brand: 'Volcom', model: 'L Gore' });
  await addItem(page, {
    category: 'helmet',
    photo: 'helmet.jpg',
    brand: 'Smith',
    model: 'Vantage',
  });
  await addItem(page, {
    category: 'goggles',
    photo: 'goggles.jpg',
    brand: 'Oakley',
    model: 'Flight Deck',
  });
}

export async function buildOutfit(page: Page, name: string, picks: [slot: RegExp, item: string][]) {
  await page.goto('/#/outfits/new');
  await expect(page.getByRole('heading', { name: 'New outfit' })).toBeVisible();
  for (const [slot, item] of picks) {
    await page.getByRole('button', { name: slot }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: item, exact: true }).click();
  }
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: /Save & view in 3D/ }).click();
  await expect(page).toHaveURL(/#\/outfits\/[0-9a-f-]+$/);
}

/**
 * True once the WebGL canvas shows a real picture (not a blank/solid frame). The canvases use
 * preserveDrawingBuffer, so the last frame can be read back.
 */
export async function expectCanvasRendered(page: Page, testId: string) {
  const canvas = page.getByTestId(testId).locator('canvas');
  await expect(canvas).toBeVisible();
  await expect
    .poll(
      () =>
        canvas.evaluate((el: HTMLCanvasElement) => {
          const probe = document.createElement('canvas');
          probe.width = 64;
          probe.height = 64;
          const ctx = probe.getContext('2d')!;
          ctx.drawImage(el, 0, 0, 64, 64);
          const data = ctx.getImageData(0, 0, 64, 64).data;
          const seen = new Set<number>();
          for (let i = 0; i < data.length; i += 4)
            seen.add((data[i] >> 4) * 256 + (data[i + 1] >> 4) * 16 + (data[i + 2] >> 4));
          return seen.size;
        }),
      { timeout: 45_000 },
    )
    .toBeGreaterThan(20);
}

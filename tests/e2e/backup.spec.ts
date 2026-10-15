import { expect, test } from '@playwright/test';
import { addItem } from './helpers';

test('export a backup and restore it on a fresh device', async ({ page, browser }, testInfo) => {
  await addItem(page, {
    category: 'helmet',
    photo: 'helmet.jpg',
    brand: 'Smith',
    model: 'Vantage',
  });
  await addItem(page, {
    category: 'gloves',
    photo: 'gloves.jpg',
    brand: 'Hestra',
    model: 'Army Leather',
  });

  await page.goto('/#/share');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export wardrobe/ }).click();
  const file = testInfo.outputPath('backup.zip');
  await (await download).saveAs(file);

  const fresh = await browser.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto('/#/share');
  freshPage.on('dialog', (d) => d.accept()); // "replace" when asked
  await freshPage.getByTestId('backup-input').setInputFiles(file);
  await expect(freshPage.getByText('Restored 2 items, 0 outfits and 2 photos.')).toBeVisible();

  await freshPage.goto('/#/wardrobe');
  await expect(freshPage.getByText('2 pieces of real gear')).toBeVisible();
  await expect(freshPage.getByRole('link', { name: /Smith Vantage/ })).toBeVisible();
  await fresh.close();
});

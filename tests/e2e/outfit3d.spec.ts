import { expect, test } from '@playwright/test';
import { buildOutfit, expectCanvasRendered, seedBasics } from './helpers';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('build an outfit, check it in 3D, share it and open the link elsewhere', async ({
  page,
  browser,
}) => {
  await seedBasics(page);
  await buildOutfit(page, 'Bluebird lap', [
    [/Jacket/, 'Burton Cyclic'],
    [/Pants/, 'Volcom L Gore'],
    [/Head/, 'Smith Vantage'],
    [/Eyes/, 'Oakley Flight Deck'],
  ]);

  await expect(page.getByRole('heading', { name: 'Bluebird lap' })).toBeVisible();
  await expectCanvasRendered(page, 'rider-canvas');

  // Peel the shell layer off.
  await page.getByLabel('Peel layers').fill('1');
  await expect(page.getByText('Shell off')).toBeVisible();

  // Snapshot downloads a captioned PNG.
  await page.getByRole('button', { name: 'Share outfit' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Snapshot/ }).click();
  expect((await download).suggestedFilename()).toBe('shred360-bluebird-lap.png');

  // Share link goes to the clipboard.
  await page.getByRole('button', { name: /Share link/ }).click();
  await expect(page.getByText('Link copied to the clipboard.')).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain('#/share/');

  // A friend opens it on another device: no local data, still sees the outfit.
  const friend = await browser.newContext();
  const friendPage = await friend.newPage();
  await friendPage.goto(link);
  await expect(friendPage.getByRole('heading', { name: 'Bluebird lap' })).toBeVisible();
  await expect(friendPage.getByText(/Shared via/)).toBeVisible();
  await expectCanvasRendered(friendPage, 'rider-canvas');
  await friendPage.getByRole('button', { name: 'Gear list' }).click();
  await expect(friendPage.getByText('Smith Vantage')).toBeVisible();
  await expect(friendPage.getByText('Oakley Flight Deck')).toBeVisible();
  await friend.close();
});

test('a damaged share link shows a friendly error', async ({ page }) => {
  await page.goto('/#/share/not-a-real-payload');
  await expect(page.getByRole('heading', { name: 'Lost in the whiteout' })).toBeVisible();
});

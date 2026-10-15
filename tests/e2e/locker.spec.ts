import { expect, test } from '@playwright/test';
import { addItem, expectCanvasRendered } from './helpers';

test('the locker hangs every item and opens details on tap', async ({ page }) => {
  await addItem(page, {
    category: 'shellJacket',
    photo: 'jacket.jpg',
    brand: 'Burton',
    model: 'Cyclic',
  });
  await addItem(page, {
    category: 'gloves',
    photo: 'gloves.jpg',
    brand: 'Hestra',
    model: 'Army Leather',
  });

  await page.goto('/#/locker');
  await expectCanvasRendered(page, 'locker-canvas');
  await expect(page.getByRole('button', { name: /Tops 1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hands 1/ })).toBeVisible();

  // Fly to the Tops zone; its only card is then centred on screen. A tap during the flight
  // counts as taking control of the camera (and stops it), so let it land first.
  await page.getByRole('button', { name: /Tops 1/ }).click();
  await page.waitForTimeout(3_000);
  const box = (await page.getByTestId('locker-canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.5);
  await expect(page.getByRole('status').getByText('Burton Cyclic')).toBeVisible();
  await expect(page.getByRole('link', { name: /Use in outfit/ })).toBeVisible();
});

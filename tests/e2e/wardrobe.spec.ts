import { expect, test } from '@playwright/test';
import { addItem, fixture } from './helpers';

test('empty wardrobe guides you to add your first jacket', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your locker is empty' })).toBeVisible();
  await page.getByRole('link', { name: /Add your first jacket/ }).click();
  await expect(page.getByRole('heading', { name: 'New shell jacket' })).toBeVisible();
});

test('adding gear with a photo suggests its colours', async ({ page }) => {
  await page.goto('/#/wardrobe/new?category=shellJacket');
  await page.getByTestId('photo-gallery-input').setInputFiles(fixture('jacket.jpg'));
  const suggestions = page.getByTestId('color-suggestions').getByRole('button');
  await expect(suggestions.first()).toBeVisible();
  // The fixture is an orange jacket with navy sleeves on a light floor.
  await expect(page.getByLabel('Body colour')).toHaveValue(/^#f[0-9a-f]{5}$/);
  await page.getByLabel('Brand').fill('Burton');
  await page.getByLabel('Model').fill('Cyclic');
  await page.getByLabel('Waterproofing').fill('20000');
  await page.getByRole('button', { name: 'Add to wardrobe' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Burton Cyclic');
  await expect(page.getByText('Orange')).toBeVisible();
  await expect(page.getByText('20000 mm')).toBeVisible();
});

test('wardrobe search matches brand and colour family', async ({ page }) => {
  await addItem(page, {
    category: 'shellJacket',
    photo: 'jacket.jpg',
    brand: 'Burton',
    model: 'Cyclic',
  });
  await addItem(page, { category: 'pants', photo: 'pants.jpg', brand: 'Volcom', model: 'L Gore' });
  await page.goto('/#/wardrobe');
  await expect(page.getByText('2 pieces of real gear')).toBeVisible();

  const search = page.getByPlaceholder(/Search/);
  await search.fill('green');
  await expect(page.getByRole('link', { name: /Volcom L Gore/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Burton Cyclic/ })).toHaveCount(0);

  await search.fill('burton');
  await expect(page.getByRole('link', { name: /Burton Cyclic/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Volcom L Gore/ })).toHaveCount(0);
});

import { expect, test } from '@playwright/test';

test.describe('linqua', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('login-with-google-btn').click();
    await page.getByText('Add new account').click();
    await page.click('#autogen-button');
    await page.click('#sign-in');
  });

  test('smoke test - add and remove one entry', async ({ page }) => {
    await expect(page.getByTestId('empty-list-main-message')).toContainText('It is lonely here...');

    await page.getByTestId('add-button').click();

    const entryForm = page.getByTestId('entry-form');

    await entryForm.getByTestId('original-text-input').fill('voertuig');
    await entryForm.getByTestId('translate-button').click();

    await expect(entryForm.getByTestId('translation-text-input')).toHaveValue('vehicle', { timeout: 10000 });

    await entryForm.getByTestId('submit-button').click();

    const entryList = page.getByTestId('entry-list');

    const addedListItem = entryList.getByTestId('entry-list-item').filter({ hasText: 'voertuig' });

    await expect(addedListItem).toBeVisible();

    await addedListItem.getByTestId('open-action-menu-button').click();

    await page.getByTestId('delete-button').click();

    await expect(page.getByTestId('empty-list-main-message')).toContainText('It is lonely here...');
  });
});

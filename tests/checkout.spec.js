const { test, expect } = require('@playwright/test');

test.describe('Mini Checkout Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mini Store Checkout' })).toBeVisible();
    await expect(page.getByTestId('order-total')).toHaveText('₹0.00');
  });

  test('1. Successful checkout produces a single confirmation with an order reference', async ({ page }) => {
    await page.getByTestId('add-tote').click();
    await page.getByTestId('add-mug').click();

    await expect(page.getByTestId('order-total')).toHaveText('₹798.50');

    await page.getByLabel(/Full Name/).fill('Jordan Lee');
    await page.getByLabel(/Order Note/).fill('Leave at front desk');

    const placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
    await placeOrderBtn.click();

    const confirmations = page.getByTestId('order-confirmation');
    await expect(confirmations).toHaveCount(1);
    await expect(confirmations).toBeVisible();
    await expect(confirmations).toContainText('Order Confirmed');
    await expect(confirmations).toContainText('Customer: Jordan Lee');
    await expect(confirmations).toContainText('Order Note: Leave at front desk');
    await expect(page.getByTestId('confirmed-total')).toHaveText('₹798.50');

    const referenceText = await page.getByTestId('order-reference').textContent();
    expect(referenceText).toMatch(/^ORD-\d+-[A-Z0-9]{4}$/);

    // Verify Place Order cannot trigger a duplicate confirmation after completion.
    const submittedBtn = page.getByRole('button', { name: 'Order Placed' });
    await expect(submittedBtn).toBeDisabled();
    await submittedBtn.click({ force: true });
    await expect(confirmations).toHaveCount(1);
    await expect(page.getByTestId('order-reference')).toHaveText(referenceText);
  });

  test('2. Missing required Full Name blocks checkout and preserves entered data', async ({ page }) => {
    await page.getByTestId('add-tote').click();
    await expect(page.getByTestId('cart-row-tote')).toBeVisible();
    await expect(page.getByTestId('order-total')).toHaveText('₹499.00');

    // Whitespace-only input must also be treated as blank.
    await page.getByLabel(/Full Name/).fill('   ');
    await page.getByLabel(/Order Note/).fill('Ring doorbell');

    await page.getByRole('button', { name: 'Place Order' }).click();

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Full Name is required');
    await expect(page.getByLabel(/Full Name/)).toHaveAttribute('aria-invalid', 'true');

    // No confirmation should be shown.
    await expect(page.getByTestId('order-confirmation')).toHaveCount(0);

    // Existing cart items and entered fields remain preserved.
    await expect(page.getByTestId('cart-row-tote')).toBeVisible();
    await expect(page.getByTestId('qty-tote')).toHaveValue('1');
    await expect(page.getByTestId('order-total')).toHaveText('₹499.00');
    await expect(page.getByLabel(/Full Name/)).toHaveValue('   ');
    await expect(page.getByLabel(/Order Note/)).toHaveValue('Ring doorbell');
  });

  test('3. Quantity changes and item removal update exact line totals and order total', async ({ page }) => {
    await page.getByTestId('add-tote').click();
    await page.getByTestId('add-mug').click();

    await expect(page.getByTestId('line-total-tote')).toHaveText('₹499.00');
    await expect(page.getByTestId('line-total-mug')).toHaveText('₹299.50');
    await expect(page.getByTestId('order-total')).toHaveText('₹798.50');

    // Increase tote quantity via '+' button from 1 -> 2 -> 3.
    await page.getByTestId('inc-tote').click();
    await page.getByTestId('inc-tote').click();
    await expect(page.getByTestId('qty-tote')).toHaveValue('3');
    await expect(page.getByTestId('line-total-tote')).toHaveText('₹1,497.00');
    await expect(page.getByTestId('order-total')).toHaveText('₹1,796.50');

    // Update mug quantity via numeric input from 1 -> 2.
    const mugQty = page.getByTestId('qty-mug');
    await mugQty.fill('2');
    await expect(page.getByTestId('line-total-mug')).toHaveText('₹599.00');
    await expect(page.getByTestId('order-total')).toHaveText('₹2,096.00');

    // Decrease tote quantity via '-' button from 3 -> 2.
    await page.getByTestId('dec-tote').click();
    await expect(page.getByTestId('qty-tote')).toHaveValue('2');
    await expect(page.getByTestId('line-total-tote')).toHaveText('₹998.00');
    await expect(page.getByTestId('order-total')).toHaveText('₹1,597.00');

    // Remove tote completely and confirm order total matches remaining item.
    await page.getByTestId('remove-tote').click();
    await expect(page.getByTestId('cart-row-tote')).toHaveCount(0);
    await expect(page.getByTestId('order-total')).toHaveText('₹599.00');
  });
});

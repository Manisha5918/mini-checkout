# Mini Checkout and Browser Test Suite

A self-contained single-page store checkout application paired with an automated Playwright browser test suite and manual test documentation.

## Project Structure

- `server.js` — Lightweight zero-dependency Node.js static server (`http://127.0.0.1:4173`)
- `public/index.html` — Single-page checkout markup
- `public/styles.css` — Clean responsive styles
- `public/app.js` — Cart state, integer-cent pricing, validation, and idempotent order submission
- `playwright.config.js` — Playwright configuration (auto-starts `node server.js` during test runs)
- `tests/checkout.spec.js` — Automated browser checks
- `TEST_PLAN.md` — Prioritized checkout risk plan and test cases
- `TEST_RESULTS.md` — Automated and manual browser execution results

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)

## Setup

```bash
npm install
```

If Playwright's Chromium browser is not already cached on your machine, install it once:

```bash
npx playwright install chromium
```

## Run the Application

```bash
npm start
```

Open `http://127.0.0.1:4173` in your browser.

## Run Automated Browser Tests

Run headless tests (Playwright starts and stops the local server automatically):

```bash
npm test
```

Run tests in a visible browser window:

```bash
npm run test:headed
```

## Manual Browser Testing Steps

1. Start the app with `npm start` and open `http://127.0.0.1:4173`.
2. **Empty Cart Check:**
   - Leave the cart empty, click **Place Order**, and verify the validation alert blocks submission.
   - Enter a name in **Full Name** with the cart still empty, click **Place Order**, and verify submission is still blocked while the entered name is preserved.
3. **Rapid Double-Click Check:**
   - Add one or more products, enter a **Full Name**, and rapidly double-click **Place Order**.
   - Verify only one **Order Confirmed** card and one order reference appear, and the button becomes disabled (`Order Placed`).

See [TEST_PLAN.md](./TEST_PLAN.md) and [TEST_RESULTS.md](./TEST_RESULTS.md) for detailed test cases and observed results.

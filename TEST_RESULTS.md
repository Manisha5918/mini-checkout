# Mini Checkout Test Results

**Execution Date:** 2026-11-25  
**Target URL:** `http://127.0.0.1:4173`  
**Currency:** INR (`₹`, integer-paise calculation with `en-IN` formatting)  
**Overall Status:** PASS (after resolving 1 defect discovered during initial test run)

---

## 1. Automated Browser Test Suite (`npm test`)

Command executed after final code edit:

```bash
npm test
```

**Result:** **3 passed (0 failed)** in Chromium (Playwright `1.59.1`, 1 worker, total `6.7s`):

| Check | Title | Status | Duration |
| --- | --- | --- | --- |
| 1 | `1. Successful checkout produces a single confirmation with an order reference` | PASS | 2.8s |
| 2 | `2. Missing required Full Name blocks checkout and preserves entered data` | PASS | 609ms |
| 3 | `3. Quantity changes and item removal update exact line totals and order total` | PASS | 748ms |

### Assertions Verified
- **Check 1:** Order total displays `₹798.50` (`₹499.00` + `₹299.50`); submitting produces `1` visible `Order Confirmed` card with customer name `Jordan Lee`, note `Leave at front desk`, total `₹798.50`, and reference matching `/^ORD-\d+-[A-Z0-9]{4}$/`; button updates to disabled `Order Placed` and a subsequent forced click keeps confirmation count at `1` with the same order reference.
- **Check 2:** Whitespace-only `"   "` in `Full Name` triggers visible `role="alert"` (`Full Name is required...`), sets `aria-invalid="true"`, produces `0` confirmation cards, and preserves cart item (`Canvas Tote Bag`, qty `1`, `₹499.00`), `Full Name` (`"   "`), and `Order Note` (`"Ring doorbell"`).
- **Check 3:** Line totals and order total update accurately across `+` increment (`₹798.50` -> `₹1,796.50`), direct numeric input (`₹1,796.50` -> `₹2,096.00`), `-` decrement (`₹2,096.00` -> `₹1,597.00`), and `Remove` (`₹1,597.00` -> `₹599.00`).

---

## 2. Exploratory / Manual Browser Checks (Empty Cart & Rapid Double-Click)

**Execution Note:** Live Chrome DevTools MCP could not attach because no running Chrome instance had remote debugging (`DevToolsActivePort`) enabled. Both scenarios were executed against the running `node server.js` instance (`http://127.0.0.1:4173`) in a fresh Playwright Chromium session with console/pageerror listeners attached.

### TC-MAN-01: Empty Cart Checkout Blocked — **PASS**
- **Step 1 (Initial Clean State):** Order Total showed `₹0.00`.
- **Step 2 (Submit with empty cart & blank Full Name):**
  - **Expected:** Submission blocked, validation alert shown, 0 confirmations.
  - **Actual:** Alert displayed: `"Your cart is empty and Full Name is required. Add at least one item and enter your name to place your order."` Confirmation count: `0`.
- **Step 3 (Submit with empty cart & filled Full Name + Order Note):**
  - **Entered:** `Full Name = "Samira Patel"`, `Order Note = "Call on arrival"`.
  - **Expected:** Submission blocked, empty-cart message shown, entered fields preserved, 0 confirmations.
  - **Actual:** Alert displayed: `"Your cart is empty. Please add at least one item before placing your order."` `Full Name` remained `"Samira Patel"`, `Order Note` remained `"Call on arrival"`, confirmation count: `0`.
- **Step 4 (Add item, remove it back to empty, then submit):**
  - **Expected:** Order Total returns to `₹0.00`, submission blocked, `Full Name` preserved.
  - **Actual:** Order Total returned to `₹0.00`, alert displayed `"Your cart is empty. Please add at least one item before placing your order."`, confirmation count: `0`.

### TC-MAN-02: Rapid Double-Click on Place Order — **PASS**
- **Steps:** Loaded `http://127.0.0.1:4173`, added 1x `Canvas Tote Bag` (`₹499.00`) and 1x `Ceramic Coffee Mug` (`₹299.50`), verified Order Total `₹798.50`, entered `Full Name = "Taylor Brooks"`, and performed a rapid double-click (`dblclick`, 20ms delay) on **Place Order**.
- **Expected:** Only one confirmation card and one order reference appear; button becomes disabled; zero console errors.
- **Actual:**
  - Confirmation count: `1`
  - Order Reference: `ORD-1001-M3U1`
  - Confirmed Total Paid: `₹798.50`
  - Submit button text: `"Order Placed"`, `disabled: true`
  - Console / page errors: `0`

---

## 3. Defect Log

### DEF-001 (Resolved): Typing into a quantity input caused the next button click to be swallowed on blur
- **Severity:** High (P1)
- **Found During:** Initial automated execution of Check 3 (`tests/checkout.spec.js`)
- **Steps to Reproduce:**
  1. Add `Canvas Tote Bag` and `Ceramic Coffee Mug` to the cart.
  2. Increase `Canvas Tote Bag` quantity to `3` via `+`.
  3. Focus the `Ceramic Coffee Mug` quantity `<input type="number">` and type `2`.
  4. Without blurring first, click the `-` button (`dec-tote`) on `Canvas Tote Bag`.
- **Expected Result:** `Canvas Tote Bag` quantity decrements from `3` to `2`.
- **Actual Result:** `Canvas Tote Bag` quantity remained at `3`.
- **Evidence (Initial Failing Output):**
  - `Expected: "2"` / `Received: "3"` at `tests/checkout.spec.js:91` (`getByTestId('qty-tote')`).
  - **Root Cause:** Pressing mouse-down on `dec-tote` blurred the mug quantity input, firing its `change` event, which called `render()` and replaced `tbody.innerHTML` mid-click—destroying the `dec-tote` DOM element before its `click` event fired. Additionally, `-`/`+` click handlers captured a stale render-time `quantity` closure.
- **Fix Applied & Verified:** Updated `public/app.js` so `input` and `change` update row totals and button disabled states in place (`applyInlineQuantity`) without rebuilding the cart table DOM, and updated `-`/`+` handlers to read `state.cart[product.id]`. Re-ran `npm test` (`3 passed`).

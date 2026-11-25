# Mini Checkout Test Plan

## 1. Scope & Objective
Verify that the **Mini Store Checkout** single-page application accurately calculates item and order totals in Indian Rupees (INR), blocks invalid checkouts with clear feedback while preserving user input, and produces exactly one order confirmation per submission.

**Test Environment:**
- Application: `node server.js` served at `http://127.0.0.1:4173`
- Products under test:
  - `Canvas Tote Bag` — `₹499.00`
  - `Ceramic Coffee Mug` — `₹299.50`
- Automated browser runner: Playwright (`@playwright/test`, Chromium)
- Manual / exploratory browser verification: Chromium against live server

## 2. Risk Prioritization

| Priority | Risk Area | Impact if Broken | Mitigation / Coverage |
| --- | --- | --- | --- |
| **P0** | **Duplicate Order Confirmation on Double-Click** | Customer receives multiple order confirmations/references for one purchase | Synchronous `orderPlaced` guard + immediate button disable; verified in automated Check 1 and manual rapid double-click test |
| **P0** | **Incorrect Line Total or Order Total** | Customer is shown or charged the wrong price (e.g., floating-point drift on `₹299.50 * N` or stale total after removal) | Integer-paise calculation (`pricePaise * quantity`); verified in automated Check 3 |
| **P1** | **Missing Required Field Not Blocked / Input Lost** | Incomplete order submitted, or customer loses cart items and notes on error | Custom accessible `role="alert"` validation; whitespace trimming; state preserved on failure; verified in automated Check 2 |
| **P1** | **Empty Cart Checkout Allowed** | Order confirmation created for `₹0.00` with no items | Cart emptiness check on submit; verified in manual empty-cart test |
| **P2** | **Invalid Quantity Input (`0`, negative, blank)** | Row disappears mid-typing or `NaN` appears in totals | Safe handling on `input` vs normalization on `change` (`1`–`99`); covered in exploratory checks |
| **P3** | **Dirty State Between Orders** | Previous confirmation or old items leak into a new order | Fresh page load per test (`beforeEach`); `Start New Order` reset button |

## 3. Test Cases

### Automated Checks (`tests/checkout.spec.js`)
Each automated check starts from a clean page load (`/`).

1. **TC-AUTO-01: Successful Checkout Produces Single Confirmation (`P0`)**
   - **Preconditions:** Clean page load (`Order Total: ₹0.00`).
   - **Steps:** Add `Canvas Tote Bag` and `Ceramic Coffee Mug`; fill `Full Name` (`Jordan Lee`) and `Order Note` (`Leave at front desk`); click `Place Order`; attempt a follow-up click on the disabled button.
   - **Expected:** Order total shows `₹798.50` before submit; exactly one confirmation card appears with heading `Order Confirmed`, customer name, note, total `₹798.50`, and a valid order reference (`ORD-...`); `Order Placed` button is disabled and second click does not create a second confirmation or change the reference.

2. **TC-AUTO-02: Missing Required Field Blocks Checkout & Preserves Input (`P1`)**
   - **Preconditions:** Clean page load.
   - **Steps:** Add `Canvas Tote Bag`; enter whitespace-only `"   "` into `Full Name` and `"Ring doorbell"` into `Order Note`; click `Place Order`.
   - **Expected:** Validation alert is visible mentioning `Full Name is required`; `Full Name` has `aria-invalid="true"`; zero confirmation cards exist; cart item (`qty = 1`, `₹499.00`) and both entered form values remain intact.

3. **TC-AUTO-03: Quantity Changes and Removal Update Exact Totals (`P0`)**
   - **Preconditions:** Clean page load.
   - **Steps:** Add `Canvas Tote Bag` (`₹499.00`) and `Ceramic Coffee Mug` (`₹299.50`); increase tote to `3` via `+`; set mug to `2` via quantity input; decrease tote to `2` via `-`; remove tote via `Remove`.
   - **Expected:** Totals update accurately at every step: `₹798.50` -> `₹1,796.50` -> `₹2,096.00` -> `₹1,597.00` -> `₹599.00`, with line totals matching `₹1,497.00`, `₹599.00`, and `₹998.00` respectively.

### Manual Browser Checks
4. **TC-MAN-01: Empty Cart Checkout Blocked (`P1`)**
   - **Steps:**
     1. Open `http://127.0.0.1:4173` with an empty cart (`₹0.00`).
     2. Click `Place Order` with `Full Name` blank, observe error.
     3. Enter `Full Name` (`Samira Patel`) and `Order Note` (`Call on arrival`) with cart still empty, then click `Place Order`.
     4. Add an item, then click `Remove` to return cart to empty while keeping `Full Name` filled, and click `Place Order`.
   - **Expected:** Checkout is blocked in all three cases; clear validation message explains the cart is empty (and `Full Name` is required in step 2); no confirmation appears; entered `Full Name` and `Order Note` are preserved.

5. **TC-MAN-02: Rapid Double-Click on Place Order (`P0`)**
   - **Steps:**
     1. Open `http://127.0.0.1:4173` in a clean tab.
     2. Add `Canvas Tote Bag` and `Ceramic Coffee Mug`, fill `Full Name` (`Taylor Brooks`).
     3. Perform a rapid double-click directly on the `Place Order` button.
   - **Expected:** Exactly one `Order Confirmed` section is rendered with a single order reference; button transitions to disabled `Order Placed`; no duplicate confirmations or console errors occur.

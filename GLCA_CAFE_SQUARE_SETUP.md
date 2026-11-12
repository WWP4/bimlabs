# GLCA Café — Square live ordering setup

The public café landing page is `/cafe.html` on the BIM Labs Netlify site. When the custom domain is added to the site, `https://cafe.bimlabsstudio.com/` rewrites to that page.

## Safe launch policy

The Square integration is fail-closed. Unless the Square access token, location, GLCA Café catalog category, pickup slots, and the explicit `SQUARE_CAFE_ORDERS_ENABLED=true` flag are configured, students **cannot** submit a payment.

Do not paste access tokens in chat, commit them to GitHub, or add them to browser JavaScript.

## 1. Prepare Square

1. In the same Square merchant account that receives the school café revenue, create a developer application at https://developer.squareup.com/apps .
2. Under **Credentials**, obtain a Sandbox access token for testing, then a separate Production token only when ready for live payments.
3. In Square Dashboard, identify the exact café **Location ID**. Use the location that will receive the orders.
4. In the Square Item Library, create a category with the exact name **GLCA Café**. Assign only the items intended for the student café to this category, even if they also have other categories.
5. Give each menu item a fixed USD price, appropriate taxes, variations, optional Square images, and the correct sold-out status. The site intentionally omits variable-priced items.
6. Be sure a suitable Square POS / Orders setup is available to kitchen staff; test receipt and fulfillment routing before launch.

## 2. Add site-level Netlify environment variables

In https://app.netlify.com/projects/bimlab > Project configuration > Environment variables, add:

| Variable | Example | Required |
|---|---|---|
| `SQUARE_ACCESS_TOKEN` | (Store as a **secret**; scope: Functions) | Yes |
| `SQUARE_LOCATION_ID` | Your Square location ID | Yes |
| `SQUARE_ENVIRONMENT` | `sandbox` then `production` | Yes |
| `SQUARE_CAFE_CATEGORY_NAME` | `GLCA Café` | Recommended (default is GLCA Café) |
| `SQUARE_CAFE_CATEGORY_ID` | ID of that Square catalog category | Optional, overrides category name |
| `SQUARE_CAFE_PICKUP_SLOTS` | `11:30,12:00,12:30,13:00` | Yes, set actual kitchen hours |
| `SQUARE_CAFE_PICKUP_DAYS` | `1,2,3,4,5` (Mon–Fri; Sun=0) | Optional |
| `SQUARE_CAFE_TIME_ZONE` | `America/Chicago` | Optional |
| `SQUARE_CAFE_LEAD_MINUTES` | `30` | Optional |
| `SQUARE_CAFE_DAYS_AHEAD` | `7` | Optional |
| `SQUARE_CAFE_RETURN_URL` | `https://cafe.bimlabsstudio.com/?checkout=returned` | Once custom domain is live |
| `SQUARE_CAFE_ORDERS_ENABLED` | `false` during setup; `true` only after test | Yes |

Use **Functions** scope for sensitive values. Redeploy when variables change.

## 3. Test before enabling real orders

1. Add Square Sandbox credentials and a Sandbox location with test menu items under the GLCA Café category.
2. Verify `/.netlify/functions/cafe-menu` returns only those items, with correct prices and sold-out status. The student page polls this feed approximately every 45 seconds.
3. Set safe Sandbox pickup slots and `SQUARE_CAFE_ORDERS_ENABLED=true`. Perform a test Square-hosted checkout. Verify the Square Order has the expected items, taxes, and PICKUP fulfillment, including the student's name, pickup time and optional dorm note.
4. Verify the order status endpoint reports payment only when Square Payments returns `COMPLETED`. Do not treat the checkout redirect alone as payment confirmation.
5. Validate the kitchen can receive and prepare orders in the relevant Square product. Confirm the kitchen's pickup schedule, capacity, sales taxes, refunds, and notification settings with the merchant.
6. Switch to Production token and location; set `SQUARE_ENVIRONMENT=production`. Make one authorized small real-money test order, confirm order routing and refunds, then open ordering for students.

## How it works

- `netlify/functions/cafe-menu.mjs`: live Square catalog/items, prices, photos, category and sold-out flags (no fake prices).
- `netlify/functions/cafe-checkout.mjs`: validates all menu items/prices against Square, validates pickup slot, then creates a Square-hosted payment link with a pickup fulfillment.
- `netlify/functions/cafe-status.mjs`: verifies order payment state against Square, without exposing student details.
- `netlify/lib/cafe-square.mjs`: shared server-only Square API and calendar utilities.
- `cafe.html`: mobile-friendly order builder; all sensitive operations run on the server.

## Important limitations

- Items are currently basic catalog variations. Modifier-group/topping selection is not yet implemented: configure popular combinations as separate Square variations until modifiers are built.
- The site uses a short polling interval for Square's item availability. This is near-real-time, not instantaneous inventory reservation.
- A payment link does not reserve stock while the buyer enters payment details; kitchen staff should manage limited batches and sold-out status.
- The public site currently provides Square-hosted checkout; no card data passes through BIM Labs.
- The page is not a kitchen dashboard. Square Dashboard/POS is the order-management source of truth.
- Keep `SQUARE_CAFE_ORDERS_ENABLED=false` until a complete Sandbox and real-payment test pass.

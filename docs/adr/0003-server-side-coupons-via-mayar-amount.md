# Server-side Coupons applied by lowering the Mayar payment amount

Buyers can apply a Coupon at Checkout to get a discount. Coupons are created and
managed in admin at `/admin/coupons` (not on the Orders page). Discount is
computed entirely on our server — we never trust a client-supplied price — and
synced to Mayar by passing the discounted value as the existing `amount` field
on `POST /hl/v1/payment/create`. The Mayar client, webhook handler, and
re-verify flow stay the same; the Order's `amount` is always the final charged
amount so webhook amount-matching continues to work.

A dedicated `POST /api/coupon/validate` lets the Checkout dialog's Apply button
confirm a code and preview the discounted price; `POST /api/checkout` re-validates
the same code before creating the Payment. Coupon codes are matched
case-insensitively. Each Coupon supports either a fixed IDR discount or a
percentage; redemptions are unlimited until the admin deactivates it or an
optional expiry passes.

When a Coupon reduces Checkout Price to Rp0, we skip Mayar (payment gateways
typically reject zero-amount requests), create the Order as `paid` immediately,
and run Fulfillment — a narrow exception that does not change the paid-checkout
path for any non-zero amount.

Considered and rejected: Mayar-native coupon/discount APIs (would add a second
integration surface and couple discount rules to the gateway; our volume is low
and admin-managed codes in our DB are simpler).

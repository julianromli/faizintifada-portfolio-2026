# Dynamic Mayar checkout with webhook-driven Resend fulfillment

The `/ui` Checkout collects the Buyer's email, then our backend calls Mayar's
`POST /hl/v1/payment/create` to make a single Payment and redirects the Buyer to
the returned hosted `link`. We create the Order as `pending` at this point so we
own the email and Mayar `transactionId` before payment. Fulfillment is driven by
Mayar's `payment.received` webhook (`POST /api/mayar/webhook`): on receipt we
match the Order by `transactionId`, mark it `paid`, and send the Access Token +
install command + guideline via Resend, recording `fulfilledAt`.

The amount is fixed server-side (`FAIZ_UI_PRICE_IDR`), never trusted from the
client. Mayar does not document an HMAC webhook signature, so the webhook URL
carries an unguessable secret as a path segment
(`/api/mayar/webhook/<MAYAR_WEBHOOK_SECRET>`; unset secret returns 404). Because
a URL secret alone is weak, we additionally re-verify by calling Mayar's
`GET /hl/v1/payment/{id}` and only fulfill when that confirms a paid status and a
matching amount. The event must be `payment.received` and must match an Order we
created. Fulfillment is idempotent — keyed on the Order id (Resend
`idempotencyKey`) and skipped when `emailSentAt` is already set — because Mayar
may retry webhooks.

Considered and rejected: a static pre-made Mayar product link (simpler, but we
would not capture the email or create the Order until the webhook, losing
pre-payment state and making matching weaker).

# Phased rollout of the faiz-ui Sales Page

We sell the Starter Kit from a `/ui` Sales Page inside this portfolio (not from
the `ui.faizintifada.com` subdomain, which serves the running Demo) to reuse the
existing portfolio shell, nav, and SEO. Phase 1 ships marketing + a Checkout
button that links out to a Mayar payment link only; the `Order` table is created
but never written to. Phase 2 adds the real Mayar gateway/webhook and the Resend
fulfillment email (install command, guideline, static Access Token), which is
what will populate `Order`. We split it this way to start selling immediately
while deferring payment/email integration that depends on Mayar API access.

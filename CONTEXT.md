# faizintifada-portfolio-2026

Personal portfolio site (Vite SPA + Hono API + Turso). Now also hosts the
sales surface for a paid product, the faiz-ui starter kit.

## Language

### Product & sales

**Starter Kit**:
The product being sold — the faiz-ui boilerplate (TanStack Start design system)
that a Buyer scaffolds into their own project.
_Avoid_: boilerplate, template, product (in code)

**Sales Page**:
The marketing + checkout page for the Starter Kit, served at the `/ui` path of
this portfolio. The thing that sells.
_Avoid_: landing page (ambiguous with the Demo's own landing)

**Demo**:
The publicly deployed, running Starter Kit (its own landing + `/ui-kit` catalog)
at `ui.faizintifada.com`. A visitor previews it here. It is NOT the Sales Page.
_Avoid_: preview, live site

**Buyer**:
A person who pays for the Starter Kit.
_Avoid_: customer, user, client

**Checkout**:
The action of leaving the Sales Page to pay. The Buyer submits their email; our
backend creates a Mayar Payment and redirects them to Mayar's hosted pay page.
_Avoid_: pay button, purchase flow

**Payment**:
A single Mayar payment request created via Mayar's API, identified by a Mayar
`transactionId` and reachable at a hosted `link`. One Payment backs one Order.
_Avoid_: invoice, charge

**Order**:
A record of one Buyer's purchase (email, amount, status, Mayar `transactionId`).
Created `pending` at Checkout; marked `paid` when Mayar's `payment.received`
webhook lands.
_Avoid_: purchase, transaction, sale

**Fulfillment**:
What a Buyer receives to use the Starter Kit: the install command, a guideline,
and an Access Token — sent by email (Resend) once an Order is `paid`. An Order is
`fulfilledAt` the moment that email is sent.
_Avoid_: delivery, onboarding

**Access Token**:
A single shared static token (same for all Buyers) that authorizes use of the
Starter Kit's private shadcn registry. Held server-side in env, emailed on
Fulfillment.
_Avoid_: license key, API key

**Checkout Price**:
The base one-time price for the Starter Kit before any Coupon is applied
(currently Rp99.000, set server-side). The amount sent to Mayar is Checkout
Price minus any valid Coupon discount.
_Avoid_: list price, sale price (those are marketing labels on the Sales Page)

**Coupon**:
A promo code an admin creates that reduces Checkout Price when a Buyer applies
it during Checkout. Each Coupon has a code, a discount (fixed IDR or percentage),
and can be active, inactive, or expired. Unlimited Buyers may use the same Coupon
while it is valid.
_Avoid_: promo code, discount code, voucher

### Coaching

**Coaching Booking**:
A request submitted via the public `/coaching` page to book a 1-on-1 vibe coding
session. Stored in `coaching_submissions`; reviewed under the "Bookings" tab of
`/admin/coaching`.
_Avoid_: coaching submission (in prose), enquiry

**Coaching Testimonial**:
Feedback a coached person submits via a public form on `/coaching` *after* a
session — name, role, rating (1–5), their experience, an optional outcome, and
consent to publish. Stored in `coaching_testimonials`; reviewed under the
"Testimonials" tab of `/admin/coaching`. Distinct from the hero Testimonial.
_Avoid_: review, feedback (in code)

**Testimonial** (hero):
An admin-authored quote shown in the homepage hero carousel (avatar, name, role,
quote, sortOrder). Stored in `testimonials`, managed at `/admin/testimonials`.
Written *by* the admin, NOT submitted by a visitor — the opposite of a Coaching
Testimonial.
_Avoid_: conflating with Coaching Testimonial

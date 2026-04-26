# 2026-04-26 — Processed Inbox Items

## Admin page layout needs help
Addressed: full tabbed redesign of the show detail page is in progress this session. Plan at `docs/superpowers/plans/2026-04-26-show-staff-roles.md`. Includes three-role system (admin/director/production_manager), per-show staff assignment via `show_staff` table, and six-tab layout (Overview, Details, Schedule & Tickets, Cast & Crew, Finances, Comms & Waivers).

## Floating effect on cards/boxes/photos
Deferred idea: give cards, boxes, and photos a subtle floating/levitating visual effect across the public-facing Accolade site. Noted here for a future CSS/animation session. Could use box-shadow animation or transform: translateY on hover with a smooth transition.

## Itemized email receipts for any payment
Deferred feature: all Stripe payments (tickets, fees) should send an itemized receipt email. Currently the fees system sends a confirmation but it may not be itemized. Needs investigation of what Stripe sends automatically vs. what Resend needs to send. Flag: check if Stripe's built-in receipts cover this or if a custom Resend template is needed.

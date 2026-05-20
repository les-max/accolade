# Processed — 2026-05-20

## Session work

- **Audition Announcement modal** — marked complete. Modal renders rich text announcement from `field_config.audition_announcement`. "Download as PDF" link added to modal footer.
- **Announcement print page** — new route `/auditions/[slug]/announcement`. Branded letterhead layout: Accolade logo, show title, audition date, announcement body, footer. Auto-triggers browser print dialog on load. Fixed toolbar (screen only) with "Print / Save as PDF" button. Returns 404 if show or announcement doesn't exist.
- **Bug fixed** — initial deploy 500'd due to `onClick` on a button inside a Server Component. Extracted toolbar into `PrintToolbar` client component.

## Current priorities for next session

1. **Webhook smoke test** — exercise the `checkout.session.completed` → `paid` path in production (not yet verified).
2. **Go-live config** — DNS, Stripe webhook for `accoladetheatre.org`, Supabase redirect URLs, Resend custom domain.
3. **Auditions "What to Expect"** — waiting on copy from Les.

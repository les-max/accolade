# Go-Live Checklist

Things to do when switching from `accolade-theatre.vercel.app` to `accoladetheatre.org`.

---

## DNS & Hosting

- [ ] Add custom domain `accoladetheatre.org` in Vercel project settings
- [ ] Update DNS records at registrar to point to Vercel (A/CNAME per Vercel instructions)
- [ ] Confirm SSL cert is issued and HTTPS works on the production domain

## Stripe

- [ ] Add a second webhook endpoint in Stripe Dashboard for `https://accoladetheatre.org/api/webhooks/stripe`
  - Event: `checkout.session.completed`
- [ ] Copy the new `whsec_...` signing secret
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel env vars (production) to the new secret
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` to **live** keys (not test keys) when ready to take real payments
- [ ] Remove or disable the `accolade-theatre.vercel.app` webhook endpoint in Stripe (or leave it for staging)

## Supabase

- [ ] Add `https://accoladetheatre.org` to Supabase Auth → URL Configuration → Site URL
- [ ] Add `https://accoladetheatre.org/**` to Supabase Auth → Redirect URLs
- [ ] Remove or keep `accolade-theatre.vercel.app` redirect URLs depending on whether staging stays active

## Resend (Email)

- [ ] Set up custom SMTP / sending domain in Resend (`accoladetheatre.org`)
- [ ] Update `FROM` addresses in email templates from `onboarding@resend.dev` fallback to verified domain
- [ ] Remove `RESEND_TEST_EMAIL` env var in production so real emails go to real recipients
- [ ] Verify emails land in inbox (not spam) after domain setup

## Environment Variables (Vercel Production)

- [ ] `STRIPE_SECRET_KEY` — live key
- [ ] `STRIPE_WEBHOOK_SECRET` — from production webhook endpoint
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — live key
- [ ] `RESEND_TEST_EMAIL` — remove or leave unset
- [ ] Confirm all other env vars (Supabase URL, anon key, service key) are set for production

## Smoke Test After Go-Live

- [ ] Sign up as a new family → confirmation email arrives
- [ ] Register for an audition → confirmation email arrives
- [ ] Pay fees → Stripe real charge → confirmation email arrives
- [ ] Webhook fires and order status flips to `paid` in Supabase
- [ ] Admin can see fee orders, bios, waivers
- [ ] Ticket purchase end-to-end

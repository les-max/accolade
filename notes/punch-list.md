# Accolade Site — Consolidated Punch List

## Quick Wins (no blockers, ready to implement)

### Homepage
- [x] **Stats band under "Now Showing"** — updated to accurate stats.
- [ ] **"There's a place here for you" cards** — wire in photos once provided (structure already built, `image: null` in `app/(public)/page.tsx` ~line 204)

### Current Season Page
- [x] **Card title font** → Bebas Neue (match Now Showing cards)

### Nav
- [x] Rename "Shows" → "Upcoming"
- [x] Move "Past Shows" to top-level nav item
- [ ] "Upcoming" dropdown: add Camps, Workshops, Events (pages don't exist yet)

### Auditions Page
- [x] Remove title text overlaid on audition card images (titles baked into images)
- [ ] Add two buttons per card: "Register to Audition" + "Audition Announcement" (modal)
- [ ] **Audition Announcement modal**: add rich text field in admin → Audition tab; render in modal on public page
- [x] FAQ — update "Is there a fee?": $50/child (first 2), $25/child (3rd+), scholarships available
- [x] FAQ — add/update: auditions announced ~30 days prior to audition date
- [ ] **"What to Expect" section** — rewrite with new copy. *Waiting on copy from Les.*

### Volunteer Page
- [x] Remove "How it Works" section entirely
- [x] Consolidate forms: keep "Ready to help out", move it into "Claim a Role" section, delete the other form
- [x] Scrolling photo bento: remove titles/labels from items
- [ ] Bento photos: *waiting on photos from Les*

### About Page
- [ ] Add large hero photo of happy families. *Waiting on photo.*

---

## Needs Design/Copy Session First

- **New Sponsor Page** — institutional/corporate audience; make the case for community theatre; path to becoming a sponsor. *Needs copy.*
- **Homepage stats band** — funny/clever replacement stats. *Les will draft.*
- **Auditions "What to Expect"** — current copy not applicable. *Needs new copy.*

---

## Larger Features (plan before building)

### User Portal + Authenticated Features
Full plan at `notes/plans/user-portal.md`. Four layers — build in order:
1. **Auth + Roles** (4 levels: User, Organizer, Business, Admin) — blocks everything else
2. **Portal shell** — dashboard for cast/crew/parents (show info, schedule, signups, payments, orders, photos)
3. **Show modules** — Volunteer signups (no Stripe needed), then Merch, Tuition, Ticketing (all need Stripe)
4. **Photographer upload** — full plan at `notes/plans/photographer-photos.md`. Uses Google Drive. Blocked on Resend + Drive API setup.

Open questions before starting: auth provider, account creation flow, photographer login vs. token URL.

### Family Member Invites
Adult family members (spouse, etc.) get their own account linked to the family. Flow: invite by email → they create account → linked to same family. Requires Resend SMTP setup first, then: `family_invites` table, invite UI in FamilyManager, `/join?token=` page, callback handler.

### Stripe Payments
Build in this order: Partner sponsorships → Tuition (tiered: $50 x2, $25 after) → Ticketing → Accolade ads.
Security: Stripe Checkout only — card data never touches our server. Keys in Vercel env vars only.

### Ticketing System (after Stripe)
Per-show admin fields: enable/disable toggle, external ticket URL (when off), flat ticket price.

### Public Calendar
iCal feed endpoint — auto-syncs when events created/updated. Works with Google, Apple, Outlook.

### Image Size Standardization
Audit all pages, define 2–3 standard aspect ratios, enforce consistently. *Design decision needed first.*

---

## Deferred / Watch List
- Donate page — keep for now, candidate for removal later
- Group tickets — revisit later

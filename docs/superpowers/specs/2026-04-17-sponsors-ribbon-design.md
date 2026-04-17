# Sponsors Ribbon — Design Spec
Date: 2026-04-17

## Context

Accolade Community Theatre has ongoing sponsors — local businesses and arts council grants — who sign on for roughly a year at a time. There was no way to display them on the site or manage them without a code change. This feature adds a homepage ribbon showing sponsor logos and a simple admin interface to manage them.

## Data Model

New `sponsors` table in Supabase:

| column | type | notes |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | text | not null — used for img alt text and admin display |
| logo_url | text | not null — Supabase Storage public URL |
| website_url | text | nullable — sponsor's site, opens in new tab |
| active | boolean | not null, default true — toggle to hide without deleting |
| sort_order | integer | not null, default 0 — lower numbers appear first |
| created_at | timestamptz | default now() |

Logos upload to a new `sponsor-logos` Supabase Storage bucket (public). Reuses the existing upload pattern from `app/(admin)/admin/shows/uploadImage.ts`.

## Admin UI

**Route:** `/admin/sponsors`

**AdminNav:** Add "Sponsors" link alongside Shows.

**Single-page management** (no detail route needed):

- Add Sponsor form at top of page with fields:
  - Sponsor Name (required)
  - Logo Image — file upload, stores to `sponsor-logos` bucket
  - Website URL (optional)
  - Display Order (optional integer, defaults to 0)
  - "Add Sponsor" submit button

- Sponsor list below the form:
  - Columns: Logo (thumbnail), Sponsor Name, Website, Active (inline toggle), Display Order, Delete
  - Active sponsors appear normally; inactive ones are visually dimmed
  - Inline active toggle updates without page reload (server action)

Labels use plain language throughout — no developer terminology.

## Homepage Ribbon

**Component:** `SponsorsRibbon` — server component, fetches active sponsors ordered by `sort_order ASC`.

**Placement:** Between the "Now Showing" section and the footer.

**Behavior:**
- Hidden entirely when no active sponsors exist
- Each logo links to `website_url` in a new tab (if set)
- Section heading: "Thank you to our sponsors" or similar

**Visual style:**
- Horizontal row of logo images
- Consistent max-height (~56px), width auto
- Logos grayscale at rest, full color on hover
- Subtle background strip to visually separate from page content

## Files to Create / Modify

- `supabase/migrations/XXX_sponsors.sql` — new table + RLS policies
- `app/(admin)/admin/sponsors/page.tsx` — admin management page
- `app/(admin)/admin/sponsors/actions.ts` — server actions (add, toggle active, delete, upload logo)
- `components/SponsorsRibbon.tsx` — homepage display component
- `app/(public)/page.tsx` — add SponsorsRibbon below Now Showing section
- `components/AdminNav.tsx` — add Sponsors link

## Out of Scope

- Sponsor tiers or benefit tracking
- Expiration dates
- Per-show sponsor associations

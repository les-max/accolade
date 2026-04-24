# Photographer Photo Upload Plan

## Goal
Photographers upload show/event photos through the site → photos land in Google Drive → album link surfaces in dashboards of everyone affiliated with that show/event.

## Roles & Access
- Photographers get a full portal account (role: `photographer`)
- They're assigned to specific shows each season by admin
- Their dashboard shows assigned shows + upload interface per show

## Upload Flow
1. Admin invites photographer via portal invite (requires Resend)
2. Admin assigns photographer to one or more shows
3. Photographer logs in, sees their assigned shows
4. They upload photos — site uses Google Drive API to push to a per-show folder
5. If no folder exists for that show, create one automatically
6. Drive folder URL saved to the show record (`photos_url` column on `shows`)

## Dashboard Surfacing
Album link appears in the dashboard of anyone linked to the show:
- Cast, crew, parents (via `show_members`)
- Attendees who signed up for events (via a future `event_signups` table)

## Attendees
- Some events (e.g. season awards) have a sign-up list, not ticketing
- Portal users who sign up see the album in their dashboard
- Non-portal attendees get the link by email (requires Resend)

## Prerequisites (in order)
1. **Resend SMTP** — needed for photographer invite + non-portal attendee emails
2. **Google Drive API** — service account, per-show folder creation, upload endpoint
3. **Schema changes:**
   - Add `photographer` to `portal_role` enum on `families`
   - Add `photos_url` column to `shows`
   - Add `event_signups` table (family_id or email → show_id)
4. **Admin UI** — assign photographer to show
5. **Photographer dashboard** — upload interface per assigned show
6. **Family dashboard** — show album links for affiliated shows/events

## Google Drive Setup Notes
- Use a service account (not user OAuth) so uploads don't depend on anyone's personal account
- Create a shared Drive folder per show, named by show title + year
- Folder is publicly viewable (link sharing on) so families don't need Drive accounts

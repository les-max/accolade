# Plan — Volunteer System

## Overview

Two distinct volunteer contexts with different access needs:

- **Show-specific volunteers** — parents/guardians with a cast member in the show. Portal access only. See their role and call times on the dashboard and calendar.
- **Org-level volunteers** — people who help run Accolade at the organization level. Get limited admin panel access (Org Volunteer role).

See `user-portal.md` for the full role/permission level definitions.

---

## Show-Specific Volunteer Positions

### Admin Side (Organizer or Org Volunteer sets this up)

Each show gets a **Volunteer Positions** section in the admin panel.

Each position has:
- **Name** — e.g. "Usher", "Front of House Lead", "Costume Helper", "Photographer"
- **Description** — what the role involves, when they're needed
- **Capacity** — how many people can fill this role
- **Type:**
  - `Open` — visible in the portal, anyone eligible can claim a spot
  - `Assigned` — hidden from self-signup; organizer or org volunteer places someone directly
- **Dates/Call Times** — which events (from the show schedule) this role is needed for

Roles like photographer, sound, lighting, and lead tech positions should default to `Assigned`. General crew (ushers, concessions, set build, costume helpers) should default to `Open`.

### Portal Side (User sees this)

Eligibility: user must have a family member in the cast of that show.

- Dashboard shows a "Volunteer Opportunities" section for each eligible show
- Lists open positions with descriptions and remaining spots
- User clicks to claim a spot — confirmed immediately (no approval step for open roles)
- Once claimed (or assigned), the role appears on their dashboard under that show
- Call times flow into their portal calendar automatically

### What Shows on the Dashboard

For each show a user is volunteering in:
- Role name and show name
- Dates/times they're expected (pulled from show schedule events tied to the position)
- A way to contact the organizer if needed (organizer contact info)

---

## Org Volunteer Admin Access

Org Volunteers get a login to the admin panel with a scoped view. They can:

| Area | Access |
|------|--------|
| Shows | View all shows and rosters (read-only) |
| Volunteer Positions | Create, edit, assign positions across all shows |
| Communications | Send broadcast emails to any group |
| Events / Calendar | Add and edit org-level events |
| Casting | No access |
| Fees / Financials | No access |
| Users | No access |
| Venues | No access |
| Sponsors | No access |

Implementation: add `org_volunteer` to the role enum in the database and gate admin nav items accordingly (same pattern as the existing `admin` vs. non-admin check in `AdminNav.tsx`).

---

## Build Order

Build after the core User Portal (Layer 2 in `user-portal.md`) is in place.

1. **Org Volunteer role** — add to DB role enum, update `AdminNav.tsx` to scope tabs by role
2. **Volunteer Positions admin UI** — new tab on each show; create/edit/delete positions, set type and capacity
3. **Position assignment** — organizer assigns users to `Assigned` positions from admin
4. **Portal signup flow** — eligible users see open positions, can claim a spot
5. **Dashboard + calendar integration** — claimed/assigned roles surface on user dashboard and calendar

---

## Decisions Made

- Volunteer signup is **limited to parents/guardians with a cast member in that show** for now. Broadening to any account holder (aging-out students, community members) is a future expansion.
- **No approval step** for open role signups — first come, first served up to capacity.
- Organizers and Org Volunteers can both assign `Assigned` roles and override open signups if needed.
- Show-specific volunteers do **not** get admin panel access.

---

## Decided

- Users **can un-claim** a volunteer role themselves at any time.
- **No notifications** to organizers when someone claims or un-claims — organizers check the volunteer roster in the admin panel whenever they want.
- **Publishing:** organizer clicks a "Publish Volunteer Positions" button in the admin show panel. Once published, a volunteer signup button appears on the family's show dashboard card — in the same area as fees and waivers. Families click it to browse open positions and claim one. Unpublishing hides the button and pauses new signups without removing existing assignments.

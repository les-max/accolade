# Accolade Community Theatre

Website for Accolade Community Theatre in Richardson, TX. Built with Next.js 15, React 19, and Tailwind CSS 4.

**Live site:** https://accolade-theatre.vercel.app
**Production domain:** accoladetheatre.org (pending cutover after Awards Night — June 19, 2026)

## Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4 + custom CSS variables
- **Language:** TypeScript
- **Deployment:** Vercel (GitHub integration)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, featured show, mission, CTAs |
| `/about` | Organization story, values, board members |
| `/auditions` | Audition info, crew roles, FAQ |
| `/tickets` | Current show tickets and pricing |
| `/past-shows` | Production archive by season |
| `/volunteering` | Volunteer roles and signup |
| `/partners` | Partnership tiers and benefits |
| `/donate` | Donation impact and giving methods |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design System

Dark theatrical aesthetic with warm navy base (`#0e0d14`) and gold/teal/rose accents.
Fonts: Playfair Display (headings), Bebas Neue (labels), Inter (body).

## Deployment

Pushes to `main` auto-deploy to Vercel. Preview deployments are created for all pull requests.

# Processed — 2026-04-24

## From inbox (2026-04-20)

### Merch order page
Low priority. Noted, deferred.

### Tickets inherit from show
Planned and implementing. Ticket system design: `ticket_performances` table links to `show_performances`, inheriting show image/venue/title. Per-performance capacity + price. See plan `crispy-hatching-crown.md`.

### Ticket creation workflow
Implementing via admin TicketManager on the show detail page: select show → performances listed → set capacity + price per performance. Stripe Checkout for public sales.

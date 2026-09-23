# All Meat, No Tip

A crowdsourced map of Toronto restaurants where tipping is not expected or service is included.

The project is a lightweight static web application designed to make it easy to discover, verify, and contribute information about restaurant tipping policies.

## Features

- Interactive map of Toronto restaurants
- List and map views
- Filter restaurants by tipping model
- Structured restaurant detail pages
- Community verification of existing information
- Structured reporting when a restaurant's policy changes
- Submission form for adding new places
- Verification history for each restaurant
- Freshness indicators based on recent reports
- Basic event tracking for usage analysis
- UTM source tracking
- Responsive layout for desktop and mobile

## Tipping Models

Restaurants can currently be classified as:

- `no_tip` — tipping is not expected
- `service_included` — service is included in the listed price or bill
- `unknown` — the tipping model has not been confirmed

The taxonomy can be extended as additional tipping models emerge from contributed data.

## Verification Status

Restaurant status is derived from community reports rather than a manually assigned confidence score.

The interface uses the date and consistency of reports to indicate how current the information is.

Typical states include:

- **Confirmed** — recently verified
- **Getting stale** — verification is several months old
- **Needs verification** — information has not been confirmed recently
- **Disputed** — recent reports conflict

Users can confirm an existing policy with **Still accurate** or submit a structured report using **This has changed**.

## Data Model

The mock data layer separates restaurants from reports.

### Restaurant

```json
{
  "id": "r001",
  "name": "Example Restaurant",
  "address": "123 Queen St W",
  "lat": 43.65,
  "lng": -79.39,
  "status": "no_tip"
}
```

### Report

```json
{
  "id": "report001",
  "restaurantId": "r001",
  "status": "no_tip",
  "evidence": "visited",
  "sourceUrl": null,
  "date": "2026-09-18"
}
```

Reports provide the underlying evidence used to calculate the restaurant's current status, verification count, and freshness.

## Contributions

Users can contribute in three ways.

### Confirm a Restaurant

Selecting **Still accurate** records a new confirmation for the restaurant's current tipping policy.

### Report a Change

Users can report what they encountered, including:

- Tip expected
- Tip prompt shown
- Service charge added
- Other changes

### Add a Place

New restaurant submissions include:

- Restaurant name
- Address
- Tipping model
- Evidence source
- Optional source URL

## Persistence

The current implementation uses static JSON for seed data and browser storage for user-generated contributions.

There is no shared database in this version. Contributions made in one browser are not visible to other users.

For a production deployment, the local persistence layer should be replaced with a shared backend such as Supabase, Firebase, or a conventional API/database.

## Analytics

The application includes lightweight event instrumentation for key interactions.

Tracked events include:

```text
map_loaded
restaurant_opened
confirmation_started
restaurant_confirmed
change_reported
add_place_started
place_submitted
```

UTM parameters are preserved so traffic from specific sources can be identified, for example:

```text
?utm_source=reddit
```

The event layer can be connected to an analytics provider such as Plausible, PostHog, Google Analytics, or another event collection service.

## Project Structure

```text
notip-toronto-v1/
├── index.html
├── styles.css
├── app.js
├── README.md
└── data/
    └── restaurants.json
```

## Running Locally

Because the application loads JSON using `fetch`, serve the repository through a local HTTP server rather than opening `index.html` directly.

Using Python:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Alternatively, use any static development server.

## Deployment

The application does not require a build process and can be hosted on any static hosting provider.

Suitable options include:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

For GitHub Pages, publish the repository root as the site source.

## Production Considerations

Before using the application as a persistent public dataset, the following infrastructure should be added:

- Shared database for restaurants and reports
- Server-side validation
- Duplicate restaurant detection
- Submission moderation
- Rate limiting and abuse protection
- Authentication or anonymous contributor identifiers if needed
- Geocoding for submitted addresses
- Automated freshness calculations
- Conflict resolution for contradictory reports
- Production analytics
- Error monitoring

## Data Accuracy

Restaurant tipping policies can change.

The application treats restaurant information as community-maintained data and exposes verification history so users can assess how recently a policy was confirmed.

Seed records should be independently verified before being presented as factual information about real businesses.

## Next Steps

To host this for free with a real (shared, not per-browser) backend:

- **Hosting**: Vercel or Netlify (free tier) for the static site.
- **Backend**: Supabase (free tier Postgres + REST/Realtime API) in place of `localStorage`. Swap `localStorage.setItem`/`getItem` calls for `fetch` calls against Supabase so restaurants and reports are shared across users instead of stuck in one browser.
- **Tradeoffs**: Supabase's free project pauses after a week of inactivity (auto-wakes on the next request, just a cold-start delay), and both platforms cap usage — fine for hobby traffic, not for anything serious.
- **Alternative**: Firebase (Firestore + Hosting) — similar free-tier limits, but NoSQL instead of SQL and tighter Google lock-in.

## Licence

No licence has been specified for this repository.

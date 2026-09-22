# Tip-Free Toronto - Reddit validation V1

A static, GitHub-ready prototype for testing whether Toronto diners will use and contribute to a crowdsourced map of restaurants where tipping is not expected.

## What changed for the validation test

The product is deliberately a structured dataset, not a review site. The primary actions are now:

- **Still accurate** - one-click confirmation of a restaurant's current tipping model.
- **This has changed** - structured report for tip expected, tip prompt, service charge, or another change.
- **Add a place** - prominent on both the header and map, with only the fields needed to create useful evidence.
- **Freshness** - listings derive their state from report dates: confirmed recently (<=90 days), getting stale (91-365 days), needs verification (>365 days/no reports), or disputed when the latest report conflicts.
- **Evidence history** - each place shows recent reports, their evidence type, date, and optional source URL.
- **No Yelp mechanics** - no ratings, reviews, or manually assigned confidence score.

The included restaurant records are fictional demo data. Replace them with researched listings before posting publicly.

## Mock backend

`data/restaurants.json` now separates `restaurants` from `reports`. User submissions and reports are stored in browser `localStorage` under `tft-data`.

This means GitHub Pages remains enough for the prototype, but contributions are only visible to the browser that submitted them. A shared backend is the next step if the Reddit test needs true cross-user crowdsourcing.

## Engagement instrumentation

The prototype records lightweight events in browser `localStorage` under `tft-analytics` and logs them to the console:

- `map_loaded`
- `restaurant_opened`
- `confirmation_started`
- `restaurant_confirmed`
- `change_report_started`
- `change_reported`
- `add_place_started`
- `place_submitted`

The event payload captures `utm_source` from the URL. For the Reddit test, link to the site with `?utm_source=reddit`.

Important: localStorage analytics are useful for testing event design but **do not give you aggregate visitor analytics**. Before the real Reddit post, connect these events to an analytics service (for example Plausible, PostHog, GA4, or your own endpoint) if you want to measure the full funnel across visitors.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Go to **Settings -> Pages**.
4. Select **Deploy from a branch**.
5. Choose the main branch and `/ (root)`.

No build step is required.

## Files

- `index.html` - application shell and structured contribution dialogs
- `styles.css` - responsive UI
- `app.js` - map, derived freshness, evidence history, contributions, and analytics events
- `data/restaurants.json` - mocked restaurants + report ledger

## Next production step

For a real public test, replace localStorage writes with a tiny shared backend (Supabase is sufficient) and connect the `track()` function to real aggregate analytics. Keep the same restaurant/report schema so the UI does not need to change substantially.

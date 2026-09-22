Given the Reddit test, I’d change the V1 from a polished directory into a very lightweight crowdsourced dataset. The goal is to make the behaviours we care about measurable.

The biggest changes:

Make “Add a place” much more prominent. It should probably be a persistent button on the map. The form should be extremely short:
Restaurant name
Location/address
Tipping model: No tipping / Service included / Not sure
“How do you know?” — visited recently / website / employee / other
Optional source URL

Make verification the primary action on every restaurant. Instead of a generic confidence score, show something concrete:

Richmond Station
No tipping
Last confirmed 12 days ago
[Still accurate] [This has changed]

Then underneath: “Confirmed by 8 people.”

That's both more understandable and more useful crowdsourcing behaviour.

Add freshness as a first-class concept. A place confirmed yesterday should look different from something last confirmed 18 months ago.

I’d use:

Confirmed — verified within 90 days
Getting stale — 3–12 months
Needs verification — 12+ months
Disputed — conflicting reports

This creates something for Redditors to actually do when they arrive.

Remove anything that feels like Yelp. No reviews, stars, “confidence 87%”, restaurant descriptions, etc. The restaurant page should answer essentially:

Does this place expect tips?

How does it work?

When was that last confirmed?

What evidence do we have?

Show the evidence/history. This is probably the biggest addition I'd make after thinking about those Reddit threads.

For example:

Recent reports

Sept 18 · Still no-tip · Visited in person
Aug 3 · Still no-tip · Visited in person
May 14 · Service included · Restaurant website

That makes the dataset inspectable rather than asking users to trust whoever runs the site.

Let someone correct data in ~2 clicks. Clicking “This has changed” could immediately ask:

What did you encounter?

○ Tip expected
○ Tip prompt shown
○ Service charge added
○ Something else

Submit.

Add one tiny bit of social proof to the homepage.

Instead of marketing copy:

Tip-free Toronto

A crowdsourced map of Toronto restaurants where tipping isn't expected.

37 places · 84 confirmations · Updated today

Those numbers should come directly from the JSON.

Instrument the experiment. This is important. I'd add lightweight analytics events for:

map_loaded
restaurant_opened
confirmation_started
restaurant_confirmed
change_reported
add_place_started
place_submitted

And capture utm_source=reddit so you can isolate the Reddit experiment.

The mock backend should change as well. Rather than a restaurant having a manually assigned confidence value, I'd model restaurants + reports:

{
  "restaurants": [
    {
      "id": "r001",
      "name": "Example Restaurant",
      "address": "123 Queen St W",
      "lat": 43.65,
      "lng": -79.39,
      "status": "no_tip"
    }
  ],

  "reports": [
    {
      "id": "report001",
      "restaurantId": "r001",
      "status": "no_tip",
      "evidence": "visited",
      "date": "2026-09-18"
    },
    {
      "id": "report002",
      "restaurantId": "r001",
      "status": "no_tip",
      "evidence": "website",
      "sourceUrl": "https://...",
      "date": "2026-08-03"
    }
  ]
}

Then the UI derives “Last confirmed Sept 18 · 2 confirmations” from the reports rather than storing that as restaurant metadata.

The most important conceptual change is that I'd make the site feel unfinished on purpose. Don't try to demonstrate that we've already built the definitive Toronto no-tip database.

When someone arrives from Reddit, I want them to immediately think:

“Oh, they don't have X.”

…and then see Add a place.

Or:

“That's wrong. They started asking for tips again.”

…and see Report change.

Those are precisely the behaviours the Reddit experiment needs to measure. If people browse but don't contribute, that's useful information too.

make those change

Updated the V1 around the Reddit validation experiment.

Download the updated GitHub-ready ZIP

The main changes are: prominent “Add a place”, one-click “Still accurate”, structured “This has changed” reporting, freshness states instead of artificial confidence scores, a visible evidence/report history, separate restaurant + report JSON data, and basic funnel event instrumentation including utm_source=reddit.

One limitation remains intentional: because this is still static, submissions are stored in the visitor’s browser. Before actually posting to Reddit, I’d make one more change: add a tiny shared backend such as Supabase so everyone sees everyone else’s contributions. Otherwise we won’t actually be testing whether the community can maintain the dataset.

Today 9:05 AM
rewrite the README.md to read like a proper readme from a dev. not the evoluation of our conversation. Dont reference the requests for changes in the new write up. just the facts on the repo

Rewritten as a conventional developer-facing README: project purpose, features, data model, persistence, analytics, project structure, local setup, deployment, and production considerations.

Download the revised README.md

Download the updated repository ZIP

README.md
Document

Library
/
README.md
Tip-Free Toronto

A lightweight, crowdsourced map of Toronto restaurants where tipping is not expected or service is included.

The application focuses on maintaining a current, structured dataset rather than restaurant reviews. Visitors can browse restaurants on a map, confirm that a listed tipping policy is still accurate, report a change, or submit a new place.

Features
Interactive map and restaurant list
Tipping-model classification for each restaurant
One-click confirmation that a listing is still accurate
Structured change reporting
New-place submissions
Freshness states based on the age of community reports
Evidence history with report date, evidence type, and optional source URL
URL-based source attribution using utm_source
Lightweight interaction event tracking
Responsive layout for desktop and mobile

The repository ships with fictional sample restaurant data for development and demonstration purposes.

Data model

Application data lives in data/restaurants.json and is separated into two collections: restaurants and reports.

A restaurant contains the stable information needed to place and identify it on the map. Reports form an append-only history of confirmations and changes to its tipping policy.

Example:

{
  "restaurants": [
    {
      "id": "r001",
      "name": "Example Restaurant",
      "address": "123 Queen St W",
      "lat": 43.65,
      "lng": -79.39,
      "status": "no_tip"
    }
  ],
  "reports": [
    {
      "id": "report001",
      "restaurantId": "r001",
      "status": "no_tip",
      "evidence": "visited",
      "date": "2026-09-18"
    }
  ]
}

Freshness and verification information displayed in the UI is derived from the report history rather than stored as a manually assigned confidence score.

Persistence

The repository is a static prototype and does not require a server-side application.

Initial data is loaded from data/restaurants.json. User-created places, confirmations, and change reports are persisted in browser localStorage under tft-data.

Because storage is local to each browser, user contributions are not shared between visitors. A shared database or API is required for multi-user persistence in a deployed version.

Analytics

Interaction events are recorded in browser localStorage under tft-analytics and logged to the browser console.

Tracked events include:

map_loaded
restaurant_opened
confirmation_started
restaurant_confirmed
change_report_started
change_reported
add_place_started
place_submitted

The event payload also captures the utm_source query parameter when present. For example:

https://example.com/?utm_source=reddit

The included event tracking is local only. Connect track() in app.js to an analytics provider or API endpoint to collect aggregate usage data across visitors.

Project structure
.
├── index.html
├── styles.css
├── app.js
├── README.md
└── data/
    └── restaurants.json
index.html contains the application shell and contribution dialogs.
styles.css contains the responsive interface styles.
app.js handles the map, filtering, freshness calculation, report history, submissions, local persistence, and analytics events.
data/restaurants.json contains the seed restaurant and report data.
Running locally

The application loads its JSON data over HTTP, so serve the repository rather than opening index.html directly from the filesystem.

Using Python:

python3 -m http.server 8000

Then open:

http://localhost:8000

No package installation or build step is required.

Deployment
GitHub Pages
Push the repository contents to GitHub.
Open the repository's Settings > Pages.
Set the source to Deploy from a branch.
Select the deployment branch and / (root) directory.
Save the configuration.

The site can be served directly from GitHub Pages because all application code is static.

Production considerations

For a public multi-user deployment, replace the localStorage persistence layer with a shared backend while retaining the existing restaurant/report model. The client-side event tracker can similarly be connected to an analytics service or first-party endpoint.

Public restaurant data should be independently verified before being added to the seed dataset.

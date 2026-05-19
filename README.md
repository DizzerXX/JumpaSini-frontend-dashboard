# JumpaSini Frontend Dashboard

## Overview

Angular 17+ web dashboard for **JumpaSini**. Serves two purposes:

1. **Web fallback for shared session links** — friends without the mobile app can open the shareable link in their browser, join the session, vote on venues, and see the confirmed meetup spot.
2. **Admin panel for venue management and halal data seeding** — Module 7 (planned).

---

## Tech Stack

| | |
|---|---|
| Framework | Angular 17+ (standalone components, no NgModules) |
| Language | TypeScript |
| Styling | SCSS with CSS custom properties — no UI framework |
| Local state | Angular Signals |
| Maps | `@angular/google-maps` |
| HTTP & polling | RxJS |
| QR code generation | `qrcode` |

---

## Architecture

- **Standalone components** throughout — no NgModules
- **OnPush change detection** on every component
- **Functional HTTP interceptors** (Angular 17+ style)
- **Lazy-loaded feature routes** — each feature chunk is loaded on demand
- **Signal-based local state** — derived values are `computed()` signals; no mutable class properties for reactive data
- All API calls go to the Laravel backend — no direct calls to Google APIs or any other external service

---

## Folder Structure

```
src/app/
├── core/
│   ├── constants/
│   │     api.constants.ts       All backend endpoint builders
│   │     app.constants.ts       UI strings, bounds, limits
│   ├── models/
│   │     session.model.ts       SessionModel, CreateSessionPayload
│   │     participant.model.ts   ParticipantModel, CreateParticipantPayload
│   │     collaboration.model.ts VoteSummary, SessionSummary, ConfirmedVenue
│   ├── services/
│   │     session.service.ts         CRUD for sessions and participants
│   │     geo.service.ts             Google Places autocomplete + geocoding
│   │     collaboration.service.ts   Voting, confirmation, session summary
│   │     recommendation.service.ts  Best-pick and venue list endpoints
│   └── interceptors/
│         api.interceptor.ts     Adds Content-Type / Accept headers
│         error.interceptor.ts   Maps HTTP errors to typed AppError
│
├── features/
│   └── session/
│       ├── create-session/   3-step session creation form
│       ├── join-session/     Short code entry → session view
│       └── session-view/     Shareable link landing page (live polling)
│
└── shared/
    ├── components/
    │     participant-card/       Participant display + optional remove button
    │     transport-selector/     Car / public transport toggle
    │     venue-type-selector/    Venue type grid picker
    │     vote-buttons/           👍 / 👎 with optimistic signal updates
    │     vote-tally/             Sorted venue vote list with progress bars
    │     confirmed-venue/        Green success card + Google Maps link
    └── pipes/
          short-code.pipe.ts      XK92MQ7P → XK92-MQ7P
```

---

## Modules Built

| # | Module | Status |
|---|---|---|
| 1 | Session + Location Input | ✅ Complete |
| 5 | Collaborative Planning + Shareable Link | ✅ Complete |
| 7 | Admin Panel | Planned |

> **Note:** Modules 2–4 (midpoint calculation, venue discovery, recommendation engine) are implemented entirely in the Laravel backend and Flutter app. The dashboard consumes the results via API — it does not reimplement any of that logic.

---

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | — | Redirects to `/create` |
| `/create` | `CreateSessionComponent` | 3-step session creation flow |
| `/join` | `JoinSessionComponent` | Enter short code to join a session |
| `/session/:shortCode` | `SessionViewComponent` | Shareable link landing page |

---

## Key Features

- **3-step session creation** — Step 1: transport mode + venue type + halal filter; Step 2: add 1–6 participant locations with Google Places autocomplete; Step 3: shareable link display + QR code
- **Shareable link landing page** — friends open `/session/:shortCode` in any browser; live state updates via 10-second polling with a "Live" dot indicator
- **Join session flow** — enter an 8-character code to go straight to the session view
- **Venue voting** — 👍 / 👎 on the top-pick venue; optimistic UI updates using Angular Signals before the server confirms
- **Vote tally** — sorted list of all voted venues with up/down counts and a per-venue progress bar
- **Venue confirmation** — confirms the meetup spot, marks the session complete, shows a green success banner
- **Google Maps embed** — confirmed venue location rendered via `@angular/google-maps` on the completed session view
- **Participant join form** — address autocomplete (GeoService) with suggestion dropdown and location resolution

---

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd JumpaSini-Frontend-Dashboard

# 2. Install dependencies
npm install

# 3. Add your Google Maps API key
#    File: src/environments/environment.ts
#    googleMapsApiKey: 'YOUR_KEY_HERE'

# 4. Ensure the Laravel backend is running
#    cd ../JumpaSini-Backend && php artisan serve
#    API should be available at http://localhost:8000

# 5. Start the dev server
ng serve

# 6. Open in browser
#    http://localhost:4200
```

---

## Brand Colours

Defined as CSS custom properties in `src/styles.scss`:

| Variable | Value | Usage |
|---|---|---|
| `--primary` | `#E8462A` | Malaysian red — buttons, links, focus rings |
| `--secondary` | `#FFCC00` | Malaysian yellow — accents |
| `--surface` | `#FFFFFF` | Card backgrounds |
| `--background` | `#F9F9F9` | Page background |
| `--text-primary` | `#1A1A1A` | Body text |
| `--text-muted` | `#6B7280` | Secondary text, labels |
| `--error` | `#DC2626` | Error states |
| `--border-color` | `#E5E7EB` | Borders, dividers |
| `--border-radius` | `12px` | Default corner radius |

---

## Building

```bash
# Development server with live reload
ng serve

# Production build
ng build
# Output: dist/jumpa-sini-frontend-dashboard/
```

---

## Bundle Sizes

Current production build output:

| Chunk | Type | Raw size |
|---|---|---|
| vendor | Initial | 219 kB |
| polyfills | Initial | 33 kB |
| create-session | Lazy | 48 kB |
| session-view | Lazy | 37 kB |
| join-session | Lazy | 5 kB |

---

## Environment Configuration

Set in `src/environments/environment.ts`:

| Key | Description |
|---|---|
| `apiBaseUrl` | Full base URL of the Laravel API (e.g. `http://localhost:8000/api/v1`) |
| `googleMapsApiKey` | API key with Maps SDK for Android, Places API enabled |

---

## Related Repos

| Repo | Stack | Purpose |
|---|---|---|
| `JumpaSini-Backend` | Laravel 11 | REST API — all business logic and external API calls |
| `JumpaSini-Mobile-App` | Flutter Android | Primary consumer app — session creation and voting |

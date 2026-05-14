# Zort

A single-page web application that lets you browse and sort all your Spotify playlists by track count or total duration.

## What it does

After logging in with your Spotify account, Zort fetches all your playlists (including private and collaborative ones) and displays them in a responsive grid. You can:

- **Sort by track count** — instant, no extra API calls needed
- **Sort by total duration** — triggers a background fetch of every playlist's tracks; durations are calculated and shown progressively as they load
- **Toggle sort direction** — switch between ascending and descending order
- **Search** — filter playlists by name in real time
- **Paginate** — 20 playlists per page with smart ellipsis navigation and a jump-to-page input
- **Open in Spotify** — each playlist card links directly to Spotify

Duration calculations are cached in `localStorage` keyed by playlist ID + snapshot ID, so re-sorting by duration on subsequent visits is nearly instant unless a playlist has changed.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI framework | React 19 |
| Build tool | Vite 6 |
| Routing | React Router 7 |
| HTTP client | Axios |
| Auth | Spotify OAuth2 with PKCE |
| Deployment | Vercel |

## Getting started

### Prerequisites

- Node.js 18+
- A [Spotify Developer](https://developer.spotify.com/dashboard) application with:
  - `http://localhost:5173/callback` added as a Redirect URI (for local dev)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <repo-url>
   cd zort
   npm install
   ```

2. Create a `.env` file at the project root:

   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

The output goes to `dist/`. The included `vercel.json` configures SPA routing so all paths are rewritten to `index.html`.

## Project structure

```text
src/
├── components/
│   ├── Header.jsx        # Displays app title and logged-in user name
│   ├── Loader.jsx        # Spinning loading indicator
│   └── Pagination.jsx    # Page navigation with ellipsis and jump-to-page
├── utils/
│   ├── duration.js       # Converts milliseconds → human-readable duration
│   └── pkce.js           # PKCE code verifier/challenge generation for OAuth2
├── App.jsx               # Root component: auth flow, data fetching, sorting, search
├── Callback.jsx          # OAuth2 redirect handler — exchanges code for access token
└── main.jsx              # React entry point
```

## Authentication flow

Zort uses the [OAuth2 Authorization Code flow with PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) — no backend required. The access token is stored in `localStorage` and sent as a `Bearer` header on every Spotify API request.

## Spotify API scopes

| Scope | Purpose |
| --- | --- |
| `user-read-private` | Read the user's profile (display name) |
| `playlist-read-private` | Access private playlists |
| `playlist-read-collaborative` | Access collaborative playlists |

## Rate limiting

When fetching track durations, the app respects Spotify's `429 Too Many Requests` responses by reading the `Retry-After` header and waiting accordingly, with up to 5 retry attempts per request. A 400 ms cooldown is applied between playlist fetches to stay within API limits.

# The War Room

A local dashboard that syncs your Sleeper and Yahoo fantasy football leagues into one
place. This is Phase 1: connecting both platforms and viewing rosters/standings/matchups
side by side. Mock drafts, a trade analyzer, player comparisons, and a news feed are
planned as follow-on phases.

## Architecture

- `client/` — React + Vite + TypeScript frontend (localhost:5174)
- `server/` — Express + TypeScript backend (localhost:4001)

The backend exists because Yahoo's Fantasy Sports API requires OAuth2 with a client
secret, which can't safely live in browser code. It also proxies Sleeper's public API
and normalizes both platforms' data into one shape. Sleeper needs no credentials at all.

Linked leagues and Yahoo tokens are stored locally in `server/data/db.json` (Yahoo
tokens are encrypted at rest). Nothing leaves your machine.

## Setup

### 1. Install dependencies

```bash
npm install
```

This installs both `client` and `server` workspaces from the root.

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Generate a session secret and paste it into `server/.env`:

```bash
openssl rand -hex 32
```

Sleeper works immediately with no further setup — skip to step 4 if you only want
Sleeper for now.

### 3. Yahoo Developer App (only needed for Yahoo sync)

1. Go to https://developer.yahoo.com/apps/create/ and create an app.
2. Fill in an Application Name and Description, and a **Homepage URL** (any valid-looking
   URL works, e.g. `http://localhost:5174` — it doesn't need to be reachable).
3. Set **Redirect URI(s)** to exactly:
   ```
   http://localhost:4001/api/yahoo/auth/callback
   ```
   Yahoo requires an exact match including the port — this is the most common setup
   mistake.
4. Keep **OAuth Client Type** as **Confidential Client**.
5. Under API Permissions, leave the checkboxes unchecked — Yahoo no longer lists a
   "Fantasy Sports" permission here; access is granted automatically via OAuth once the
   user consents, not gated by a checkbox on this form.
6. Click **Create App**, then copy the generated **Client ID** and **Client Secret** into
   `server/.env`:
   ```
   YAHOO_CLIENT_ID=...
   YAHOO_CLIENT_SECRET=...
   ```

### 4. Run it

```bash
npm run dev
```

This starts the Express server on port 4001 and the Vite dev server on port 5174.
Open http://localhost:5174.

- Click **Add leagues**, enter your Sleeper username, select the leagues you want, and/or
  click **Connect Yahoo** to authorize and select Yahoo leagues.
- Your linked leagues show up together on the dashboard.

## Known limitations (Phase 1)

- Read-only: no lineup changes, waivers, or trades can be executed yet.
- Yahoo's API returns deeply nested JSON with an unusual shape; the parsing in
  `server/src/services/yahooClient.ts` is written against Yahoo's documented format but
  hasn't been exercised against a real Yahoo account yet (it needs a registered Yahoo
  app to test). If league/roster data looks wrong after connecting Yahoo, that's the
  first place to check — the `fantasy_content` response shape is worth logging and
  comparing against what's expected.
- Mock draft simulator, trade analyzer, player comparison tool, and news feed are not
  built yet — this phase only covers league sync and the dashboard.

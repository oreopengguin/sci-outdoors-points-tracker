# Science Outdoors Tuff Points Tracker

A live team scoreboard for Science Outdoors. Anyone can watch the board; only a
signed-in teacher can change a score.

<p align="center">
  <img src="public/leaf.svg" width="72" height="72" alt="" />
</p>

## What it does

- **Public leaderboard** — every team, its crest and its score, ranked live. Ties are shown as
  ties, movement up and down the table is flagged, and the board refreshes itself.
- **Big-screen mode** (`/display`) — a podium and huge type, built to sit on a projector all day.
  Press <kbd>F</kbd> for fullscreen.
- **Teacher console** (`/teacher`) — award or deduct points for any team with a reason, undo a
  mistake, and rename or restyle a team mid-season.
- **Point history** (`/history`) — the full audit trail, searchable and filterable by team.
- **Season reset** — choose how many teams there are (2–16), then give each one a name and a crest
  from a catalogue of **393 science and nature crests** across 18 categories. Resetting requires a
  signed-in teacher and an explicitly typed confirmation.
- Light and dark themes, keyboard shortcuts, reduced-motion support, and a confetti burst when the
  lead changes hands.

## Running it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Signing in

The teacher account defaults to:

| Field    | Value       |
| -------- | ----------- |
| Username | `soteacher` |
| Password | `meow67`    |

The password is **not** stored in the source — only a scrypt hash of it is. To change the
credentials, set `TEACHER_USERNAME` and `TEACHER_PASSWORD_HASH` (see below).

## Deploying to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foreopengguin%2Fsci-outdoors-points-tracker&project-name=sci-outdoors-points-tracker&repository-name=sci-outdoors-points-tracker)

1. Import this repository on [vercel.com/new](https://vercel.com/new), or use the button above. The
   defaults are correct — it is a stock Next.js app, so there is nothing to configure.
2. **Add a key-value store.** In the project's **Storage** tab, add any Redis-compatible store
   (Upstash Redis works out of the box). Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   automatically, which is all the app needs.
3. Redeploy.

Without a store, the app falls back to the local filesystem. That is fine for development, but a
serverless deployment gets a fresh filesystem per instance — so scores would come and go, and
sign-in would not work at all. The app detects this: it shows a warning banner to signed-in
teachers, and refuses to sign anyone in rather than handing out a session the next request would
reject.

### If sign-in bounces you back to the login page

That means the deployment has no shared session-signing key, so the server that issued your cookie
and the server that checked it disagreed. Either fix works:

- Add a Redis store as above (recommended — you need it for the scores anyway), **or**
- Set an `AUTH_SECRET` environment variable to any long random string:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```

Then redeploy and sign in again.

### Environment variables

All of these are optional.

| Variable                | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `KV_REST_API_URL`       | Redis REST endpoint. `UPSTASH_REDIS_REST_URL` also works.                                |
| `KV_REST_API_TOKEN`     | Redis REST token. `UPSTASH_REDIS_REST_TOKEN` also works.                                 |
| `TEACHER_USERNAME`      | Overrides the sign-in username. Defaults to `soteacher`.                                 |
| `TEACHER_PASSWORD_HASH` | Overrides the password. See below for how to generate one.                               |
| `AUTH_SECRET`           | Session signing key. If unset, one is generated and stored in the KV store on first use. |
| `SOT_DATA_DIR`          | Where the filesystem fallback writes. Development only.                                  |

To generate a new password hash:

```bash
node -e "const{scryptSync,randomBytes}=require('crypto');const s=randomBytes(16);const N=32768,r=8,p=1;console.log('scrypt\$'+N+'\$'+r+'\$'+p+'\$'+s.toString('base64url')+'\$'+scryptSync(process.argv[1],s,64,{N,r,p,maxmem:268435456}).toString('base64url'))" 'your-new-password'
```

## How the security works

Students will poke at this. The design assumes that.

- **Nothing on the client decides who may score.** Every mutation goes through a server route that
  re-checks the session. Editing the page, calling the API by hand or flipping a flag in devtools
  all hit the same wall.
- **Sessions** are HMAC-signed tokens in an `HttpOnly`, `Secure`, `SameSite` cookie, so JavaScript
  on the page can't read or forge one. They expire after eight hours.
- **Passwords** are verified against a scrypt hash with a constant-time comparison, and the hash is
  never sent to the browser. Wrong username and wrong password give an identical response, and both
  paths run the key derivation so the timing matches.
- **CSRF** is blocked with a double-submit token plus an `Origin` check, so another site cannot make
  a signed-in teacher's browser award points.
- **Rate limiting** caps sign-in attempts per client, with a separate global cap on _failures_ to
  catch someone rotating IP headers.
- **Content-Security-Policy** requires a per-request nonce on every script, so an injected
  `<script>` will not execute. Framing, sniffing and referrer leakage are blocked too.
- **All input is validated server-side** with Zod — point deltas are capped, reasons are length
  limited, and crest and colour ids must exist in the catalogue.
- **Resetting** needs a valid session, a valid CSRF token _and_ a typed confirmation phrase.
- **Concurrent edits** use a compare-and-set loop, so two teachers scoring at once can't clobber
  each other.

## Project layout

```
src/
  app/            routes — pages and the JSON API under app/api
  components/     UI: leaderboard, crests, dialogs, teacher console
  lib/
    auth.ts       sessions, password verification, CSRF, rate limiting
    state.ts      domain model and every mutation, all pure and testable
    store.ts      the one persistence seam (Redis REST, filesystem fallback)
    logos.ts      the crest catalogue and its search
  proxy.ts        security headers and the CSP nonce
```

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

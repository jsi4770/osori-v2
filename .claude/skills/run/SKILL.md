---
name: run
description: Launch and drive the OSORI (fincoach) app locally — Spring Boot backend + React/Vite frontend + PostgreSQL — for manual or Playwright-driven verification.
---

# Running OSORI (fincoach) locally

Spring Boot 3 backend (`server/`) + React 19/Vite frontend (`app/`) + PostgreSQL. No H2 anywhere — the datasource is always PostgreSQL (`server/pom.xml` only has the `org.postgresql` driver), despite a stale "H2, MODE=Oracle" comment at the top of `schema.sql`.

## Prerequisites

- PostgreSQL running: `brew services list | grep postgres` / `pg_isready`. Start with `brew services start postgresql@16` if needed. DB name is `fincoach`.
- `server/src/main/resources/application-local.properties` must exist (gitignored) with real `spring.datasource.*`, `jwt.secret`, etc. Copy from `application.properties.example` if missing.
- `coaching.llm.enabled` in that file controls whether AI-coaching endpoints (`/coaching/nudge`, `/coaching/chat`, `/coaching/trend`) call the real Gemini API or fall back to canned mock text. Leave it `false` for functional testing (fast, free, deterministic) — flip to `true` only when you specifically need to check real Gemini prompt/response quality.

## Run

Backend (background, port 8080, context path `/fincoach`):

```bash
cd server
SPRING_PROFILES_ACTIVE=local nohup ./mvnw spring-boot:run > /tmp/backend.log 2>&1 &
disown
for i in $(seq 1 40); do curl -sf http://localhost:8080/fincoach/actuator/health >/dev/null && break; sleep 2; done
curl -s http://localhost:8080/fincoach/actuator/health   # -> {"status":"UP",...}
```

`spring-boot-devtools` is on the classpath, so once it's up, recompiling (`./mvnw -q compile`) auto-restarts the app context — you usually don't need to manually kill/restart after a code change.

**Gotcha — `schema.sql` changes don't apply to an already-existing table.** `spring.sql.init.mode=always` re-runs `schema.sql` on every startup/devtools-restart, but every statement is `CREATE TABLE IF NOT EXISTS`. If you add a constraint (e.g. a `UNIQUE`) to a table that already exists in your local DB from before the change, it silently won't apply — inserts relying on the new constraint (e.g. `ON CONFLICT (...)`) will 500 with "no unique or exclusion constraint matching". Fix: `psql -h localhost -U postgres -d fincoach -c "DROP TABLE IF EXISTS the_table;"` then restart the backend so `schema.sql` recreates it correctly. Real deploys (Railway) aren't affected since the table is created fresh there.

Frontend (background, port 5174, Vite proxies `/fincoach` to the backend):

```bash
cd app
npm run dev &> /tmp/frontend.log &
for i in $(seq 1 30); do curl -sf http://localhost:5174 >/dev/null && break; sleep 1; done
```

Stop either by killing the port's listener (the backgrounded shell's `$!` is just the wrapper):

```bash
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill   # backend
lsof -ti:5174 -sTCP:LISTEN | xargs -r kill   # frontend
```

Before starting either, check if something's already listening on 8080/5174 — a dev instance is very often already running from the user's own terminal; reuse it (`curl` the health endpoint) rather than assuming you need to start one.

## Drive it (Playwright)

No `chromium-cli` in this environment. Use the `playwright` npm package directly (already resolvable via `npx playwright install chromium` — installs fast, already cached in this environment). Write a throwaway `.mjs` script under your scratchpad and `node` it; don't install playwright into the project's own `node_modules`.

```js
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-quic'] });
// See viewport gotcha below — this is not optional for this app.
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto('http://localhost:5174/register', { waitUntil: 'load' }); // NOT 'networkidle', see gotcha
await page.waitForSelector('input[name="loginId"]', { timeout: 20000 });
```

### Gotcha — the app wraps itself in an iframe on desktop-sized viewports

`app/src/Root.jsx` mounts a phone-shaped `DesktopFrame` (an `<iframe src={window.location.href}>`) whenever `window.matchMedia("(min-width: 600px) and (pointer: fine) and (hover: hover)")` matches — which is exactly Playwright's default viewport + default (non-touch) emulation. When that happens, `page.locator(...)`/`waitForSelector`/`fill` on the top-level `page` will silently never find anything (they only search the main frame), even though a `page.screenshot()` looks completely normal (screenshots capture cross-frame content, selectors don't). It is NOT a broken page — it just moved one frame down.

**Fix: use a phone-sized viewport** (e.g. `{ width: 390, height: 844 }`) so the media query fails and the app renders directly in the top-level frame. This is also the more representative way to test this mobile-first app. (The alternative — `page.frameLocator('iframe.desktop-frame-iframe')` — works too if you ever need the desktop-frame view specifically, but there's no reason to for this app.)

### Gotcha — `waitUntil: 'networkidle'` hangs forever

Vite's dev client keeps a persistent HMR WebSocket open, so Playwright's `networkidle` heuristic never settles and the navigation eventually times out. Use `waitUntil: 'load'` (the default) plus an explicit `page.waitForSelector(...)` for the element you actually need.

## Auth for testing

Register a fresh user via the UI (simplest — no known passwords to guess for existing DB rows):

- `/register` fields: `input[name="loginId"]` (alnum, 8–16 chars), `input[name="password"]` (any non-empty), `input[name="userName"]` (Korean, 3–5 chars), `input[name="nickName"]` (Korean, 3–5 chars), `input[name="email"]` (`x@y.z` shape, 10–20 chars total). Submit button text: `회원가입`. On success it `alert()`s ("회원가입 성공" — needs a `page.on('dialog', d => d.accept())` handler) then navigates to `/login` with the loginId prefilled.
- `/login` fields: `input[name="loginId"]`, `input[name="password"]`. Submit button text: `로그인`. Success navigates to `/mypage/assets` (home).
- Add an expense: go to `/mypage/expenseForm`, fill `input[name="transDate"]` (yyyy-MM-dd), `input[name="title"]`, `input[name="originalAmount"]`, `select[name="category"]` (see `app/src/constants/categories.js` for values), submit button text `지출 등록하기`. Also `alert()`s ("저장되었습니다!") then navigates to `/mypage/calendarView`.
- Growth report: `/mypage/coaching/report`. The macro spending-trend card is `.spending-trend-card`; per-anomaly nudge history is `.grp-item`.

Clean up test users/data after: `DELETE FROM COACHING_MESSAGE/SPENDING_TREND/MYTRANS/AUTH_ACCOUNT/USERS WHERE USER_ID = <id>` (in that order, for FK constraints) via `psql -h localhost -U postgres -d fincoach`.

## One representative interaction

Sign up → add one expense → visit `/mypage/coaching/report` → assert `.spending-trend-card` is present and non-empty → screenshot. That single path exercises frontend routing, backend auth, the transaction API, and the AI-coaching endpoints in one go.

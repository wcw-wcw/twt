# twt

Small Twitter/X-inspired social app built for portfolio and demo use. Users can register, log in, create short posts, reply in threads, quote posts, repost, follow users, receive in-app notifications, and browse profiles, search results, mentions, and hashtags.

The project is intentionally simple: a Vite React frontend, an Express API, and PostgreSQL tables managed by `database/schema.sql` plus additive migrations.

## Tech Stack

- Frontend: React 19, React Router, Vite, plain CSS
- Backend: Node.js, Express 5, CommonJS modules
- Database: PostgreSQL with `pg` and UUIDs from `pgcrypto`
- Auth: JWT bearer tokens stored by the frontend in `localStorage`
- Passwords: bcrypt hashes
- Deployment target: Vercel frontend plus Express API entrypoint, with Neon/Postgres for data
- Optional local demo helper: Ollama HTTP API for simulated demo-only content generation

## Repository Layout

```text
api/index.js                 Vercel API entrypoint that exports the backend app
backend/                     Express API, controllers, route modules, DB pool, scripts
backend/controllers/         Request handlers for auth, posts, users, search, notifications
backend/lib/                 Shared post row mapping, discovery, and notification helpers
backend/middleware/          JWT auth middleware
backend/routes/              Express route declarations
backend/scripts/             Demo seed, cleanup, and optional Ollama generator
database/schema.sql          Full schema for a fresh database
database/migrations/         Additive migrations for existing databases
frontend/                    Vite React app
frontend/src/components/     UI components
frontend/src/pages/          Route-level pages
frontend/src/lib/api.js      Frontend API helpers
vercel.json                  Vercel build and route configuration
```

Personal architecture notes may live in `docs/ARCHITECTURE.md`; that file is intentionally ignored and not meant to be committed.

## Core Features

- Account registration and login with JWT authentication
- Public home timeline of top-level posts
- Post creation and deletion
- Direct replies shown on `/post/:id` thread pages
- Quote posts with quoted-post previews
- Reposts stored separately from posts
- Profile pages with authored posts, reposts, follower/following counts, and connection lists
- Follow/unfollow
- In-app notifications for follows, replies, mentions, quote posts, and reposts
- Backend discovery of clickable `@mentions` and `#hashtags`
- Search across users, post content, and hashtags
- Hashtag pages
- Clearly labeled simulated demo accounts and demo content
- Optional local-only Ollama demo content generator

## Scripts

Backend:

```sh
npm run seed:demo --prefix backend
npm run seed:demo:clear --prefix backend
npm run demo:generate --prefix backend -- --dry-run --limit 3 --model llama3.2:3b
```

Frontend:

```sh
npm run dev --prefix frontend
npm run build --prefix frontend
npm run lint --prefix frontend
npm run preview --prefix frontend
```

There is no dedicated backend test suite yet. A basic backend module-load smoke check is:

```sh
node -e "require('./backend/server')"
```

## Environment Variables

Create `backend/.env` for local development. This file is ignored by git.

```sh
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
```

The backend DB pool also supports individual PostgreSQL variables when `DATABASE_URL` is not set:

```sh
DB_USER="USER"
DB_PASSWORD="PASSWORD"
DB_HOST="localhost"
DB_NAME="DB"
DB_PORT="5432"
PGSSLMODE="require"
```

Optional local Ollama generator variables:

```sh
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:3b"
```

Frontend environment:

```sh
VITE_API_BASE_URL="http://localhost:3001"
```

In development, the frontend defaults to `http://localhost:3001` when `VITE_API_BASE_URL` is not set. In production, leave it blank when the API is served from the same Vercel domain under `/api`.

Safe placeholder files:

- `.env.example`
- `backend/.env.example`

Do not commit real database URLs, JWT secrets, local credentials, API keys, generated logs, database dumps, build output, or `node_modules`.

## Local Development Setup

1. Install dependencies:

   ```sh
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Create `backend/.env` with local values.

3. Create a fresh database schema:

   ```sh
   psql "$DATABASE_URL" -f database/schema.sql
   ```

   For an existing database, apply migrations in order instead:

   ```sh
   psql "$DATABASE_URL" -f database/migrations/001_post_replies.sql
   psql "$DATABASE_URL" -f database/migrations/002_quote_posts.sql
   psql "$DATABASE_URL" -f database/migrations/003_reposts.sql
   psql "$DATABASE_URL" -f database/migrations/004_discovery.sql
   psql "$DATABASE_URL" -f database/migrations/005_notifications.sql
   psql "$DATABASE_URL" -f database/migrations/006_demo_accounts.sql
   ```

4. Start the backend:

   ```sh
   node backend/server.js
   ```

5. Start the frontend:

   ```sh
   npm run dev --prefix frontend
   ```

6. Open the Vite URL, usually `http://localhost:5173`.

## Database and Migrations

`database/schema.sql` is the full current schema for a new database. The migrations are additive patches for databases that predate specific features:

- `001_post_replies.sql`: `parent_post_id` and thread indexes
- `002_quote_posts.sql`: `quote_post_id`
- `003_reposts.sql`: `reposts` table and indexes
- `004_discovery.sql`: mention and hashtag tables/indexes
- `005_notifications.sql`: notifications table/indexes
- `006_demo_accounts.sql`: `is_demo` and `demo_label` user columns

The migrations use `IF NOT EXISTS` where practical and are intended to be safe to rerun. No migration runner is included; apply SQL manually with `psql` or your database provider's SQL console.

## Demo Data

The deterministic demo seed creates simulated `demo_*` users, posts, follows, replies, quote posts, reposts, mentions, hashtags, and demo-to-demo notifications.

```sh
npm run seed:demo --prefix backend
```

The seed is idempotent. It finds existing demo rows instead of duplicating them. Demo users have random unusable passwords and are display accounts only.

To remove seeded demo users and their dependent rows:

```sh
npm run seed:demo:clear --prefix backend
```

The cleanup script deletes only users where `is_demo = TRUE` and `username LIKE 'demo_%'`.

## Optional Ollama Demo Generator

The Ollama generator is a local-only, manually run enhancement for adding extra simulated demo content. It does not run with the backend server and does not connect to Twitter/X or any external social platform.

Default model:

```sh
llama3.2:3b
```

Dry run without inserting rows:

```sh
npm run demo:generate --prefix backend -- --dry-run --limit 5
```

Insert a small validated batch:

```sh
npm run demo:generate --prefix backend -- --limit 5
```

Loop mode:

```sh
npm run demo:generate --prefix backend -- --loop --interval-ms 30000
```

Supported flags:

- `--dry-run`
- `--limit`
- `--model`
- `--base-url`
- `--loop`
- `--interval-ms`

Safety behavior:

- Loads only users where `is_demo = TRUE`
- Maps model-provided target hints to existing demo-authored posts
- Rejects unknown item types, non-demo authors, real-user mentions, empty content, overlong content, risky financial language, impersonation-like content, and practical duplicates
- Does not allow model output to choose raw database IDs
- Uses transactions per generated item
- Can create demo-to-demo notifications only

## API Routes

Public or optionally authenticated:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `GET /api/posts/:id/thread`
- `GET /api/search?q=term`
- `GET /api/hashtags/:tag/posts`
- `GET /api/users/:id`
- `GET /api/users/:id/posts`
- `GET /api/users/:id/followers`
- `GET /api/users/:id/following`

Authenticated:

- `GET /api/auth/me`
- `POST /api/posts`
- `POST /api/posts/:id/replies`
- `POST /api/posts/:id/quote`
- `POST /api/posts/:id/repost`
- `DELETE /api/posts/:id/repost`
- `DELETE /api/posts/:id`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

The backend also mounts the same route groups without the `/api` prefix for local flexibility.

## Deployment Notes

The intended production shape is Vercel plus a hosted PostgreSQL database such as Neon.

1. Create a hosted Postgres database.
2. Run `database/schema.sql` for a new database, or run all migrations in order for an existing database.
3. Import this repository into Vercel.
4. Configure environment variables:

   ```sh
   DATABASE_URL=your-hosted-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   CLIENT_URL=https://your-vercel-project.vercel.app
   NODE_ENV=production
   ```

5. Deploy. `api/index.js` exports the Express app for Vercel, and the frontend calls `/api` on the same domain when `VITE_API_BASE_URL` is blank.

Before deployment:

```sh
npm install --prefix backend
npm install --prefix frontend
npm run build --prefix frontend
npm run lint --prefix frontend
node -e "require('./backend/server')"
npm audit --prefix backend
npm audit --prefix frontend
```

Do not configure the optional Ollama generator in Vercel. It is a local-only command-line helper.

## Known Limitations

- No automated backend test suite yet
- JWT is stored in `localStorage`, which is simple but not as robust as secure HTTP-only cookie sessions
- Search is basic `LIKE` matching, not full-text search or ranking
- Threads show direct replies only; nested reply rendering is not implemented
- Notifications are in-app only; no realtime, email, SMS, or push notifications
- No image uploads or media storage
- No admin/moderation tools
- Demo accounts are simulated display data only and have no documented login credentials

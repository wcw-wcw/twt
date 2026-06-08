# Twitter Clone Deployment

Blogging application inspired by Twitter/X. Users can register accounts, create short posts, follow each other, view profile pages, and reply to posts in direct conversation threads.

This app deploys to Vercel as a Vite static frontend plus an Express API mounted at `/api`.

## Features

- Secure login and registration using JWT and bcrypt hashing
- Persistent login
- Post creation and deletion with timestamps and authors
- Public home timeline for top-level posts
- Direct replies on dedicated post thread pages
- Reply counts on post cards
- Quote posts with a compact preview of the referenced post
- Simple reposts with per-post counts and undo support
- In-app notifications for follows, replies, mentions, quote posts, and reposts
- Clearly labeled simulated demo community seed data for portfolio presentations
- Profile pages with user statistics, following/followers, and top-level posts
- Following/unfollowing of other users
- First-pass discovery with clickable @mentions, #hashtags, search, and hashtag pages

## Replies / Threads

Replies are stored as normal posts with a nullable `parent_post_id`. The home timeline and profile post lists show top-level posts only. A post thread page at `/post/:id` shows the selected post and its direct replies ordered oldest-first.

The current implementation supports direct replies first. Deeper nested thread rendering is left as a future enhancement.

## Quote Posts

Quote posts are stored as normal top-level posts with a nullable `quote_post_id` reference to the original post. A quote post has its own author and content, and timelines render a compact preview that links back to the quoted post thread.

## Reposts

Reposts are textless shares stored in the separate `reposts` table. They do not create a new row in `posts`, and each user can repost a given post once. Logged-in users can repost or undo a repost from post cards, and cards show the current repost count.

Quote posts and reposts are intentionally separate concepts: quote posts are posts with new text plus a reference to another post, while reposts are no-text shares represented only by `(user_id, post_id)` rows.

## Discovery

Post content is parsed on the backend for `@mentions` and `#hashtags` when normal posts, replies, and quote posts are created. Mentions resolve existing users only; unresolved `@text` remains normal post text and does not block creation. Hashtags are stored lowercase without the `#` symbol.

Known mentions and hashtags are returned in post API responses and rendered as safe clickable links in timelines, profile pages, thread pages, replies, quote posts, and quoted-post previews. Mentions link to `/profile/:id`, and hashtags link to `/hashtag/:tag`.

Search at `/search?q=term` is a first-pass implementation that groups users, post content, and hashtags. Hashtag pages show posts associated with a tag. This is not a full ranking, trending, or autocomplete system yet.

## In-app Notifications

Notifications are database-backed records shown inside the app at `/notifications`. Logged-in users can view their own notifications, see an unread count in navigation, mark one notification as read, or mark all notifications as read.

Supported notification types are:

- `follow`
- `reply`
- `mention`
- `quote`
- `repost`

Notifications are private to the recipient. The backend requires JWT auth for notification routes and only returns or updates notifications owned by the current user. This pass is in-app only; realtime WebSocket updates, email, SMS, and push notifications are future enhancements.

## Demo Community

The app includes an optional demo community seed for portfolio presentations. Demo accounts are simulated/sample accounts only. They are marked in the database with `is_demo = true`, use `demo_label = 'Simulated demo account'`, and render with a visible `Demo` badge in the UI.

The demo system does not automate, post to, scrape, or interact with Twitter/X or any external social platform. It only inserts local sample rows into this app's configured PostgreSQL database.

Run the demo-account migration before seeding an existing database:

```sh
psql "$DATABASE_URL" -f database/migrations/006_demo_accounts.sql
```

Seed the demo community:

```sh
npm run seed:demo --prefix backend
```

The seed is deterministic and idempotent. Running it more than once finds the same demo users, posts, follows, replies, quote posts, reposts, mentions, hashtags, and demo-to-demo notifications instead of duplicating them. Demo users are display accounts with random unusable passwords, so there are no documented demo login credentials.

To remove the seeded community:

```sh
npm run seed:demo:clear --prefix backend
```

The cleanup script deletes only seeded demo users with `is_demo = true` and `demo_%` usernames. Existing real users are not deleted.

## Optional Ollama Demo Generator

The deterministic demo seed remains the recommended default demo setup. For a local-only enhancement, the backend also includes an optional Ollama-powered generator that can add extra simulated demo posts, replies, quote posts, and reposts from the command line.

This generator is manual and local-only. It uses the local Ollama HTTP API, does not require an Ollama cloud account, does not run with the backend server, and does not interact with Twitter/X or any external social platform. Generated users and content are simulated demo data only, and the script only uses existing `is_demo = true` users and demo-authored target posts.

Install and start Ollama locally, then pull or make available a local model such as `llama3.2`. Run the deterministic seed first so demo users and target posts exist:

```sh
npm run seed:demo --prefix backend
```

Preview a batch without inserting rows:

```sh
npm run demo:generate --prefix backend -- --dry-run --limit 5
```

Insert a small validated batch:

```sh
npm run demo:generate --prefix backend -- --limit 5
```

Run continuously until Ctrl+C:

```sh
npm run demo:generate --prefix backend -- --loop --interval-ms 30000
```

Configuration is available through CLI flags or environment variables:

```sh
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

Equivalent flags are `--base-url` and `--model`. The script requests JSON from Ollama, validates every generated item before insertion, rejects real-user mentions, rejects non-demo authors or targets, rejects overlong and risky financial content, and skips invalid items while allowing the rest of a valid batch to proceed. Valid generated replies, quote posts, reposts, and mentions can create demo-to-demo notifications only; the generator refuses non-demo notification recipients.

## Local development

1. Create `backend/.env` with your local database settings:

   ```sh
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB"
   JWT_SECRET="replace-with-a-long-random-secret"
   CLIENT_URL="http://localhost:5173"
   ```

   Alternatively, the backend database pool also reads local PostgreSQL variables when `DATABASE_URL` is not set:

   ```sh
   DB_USER="USER"
   DB_PASSWORD="PASSWORD"
   DB_HOST="localhost"
   DB_NAME="DB"
   DB_PORT="5432"
   ```

2. Install dependencies:

   ```sh
   npm install --prefix frontend
   npm install --prefix backend
   ```

3. Create the database tables:

   ```sh
   psql "$DATABASE_URL" -f database/schema.sql
   ```

4. Start both apps:

   ```sh
   npm run dev --prefix frontend
   node backend/server.js
   ```

## Existing database migrations

For an existing local or Neon database, run the replies migration after deploying this change:

```sh
psql "$DATABASE_URL" -f database/migrations/001_post_replies.sql
psql "$DATABASE_URL" -f database/migrations/002_quote_posts.sql
psql "$DATABASE_URL" -f database/migrations/003_reposts.sql
psql "$DATABASE_URL" -f database/migrations/004_discovery.sql
psql "$DATABASE_URL" -f database/migrations/005_notifications.sql
psql "$DATABASE_URL" -f database/migrations/006_demo_accounts.sql
```

The replies, quote-post, and demo-account migrations use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so they are safe to run against databases that may already have those columns. The reposts, discovery, and notifications migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

If API smoke tests create temporary `discover_*` or notification smoke-test users/posts in your configured database, they are test data. You can optionally remove those rows after testing with targeted deletes for the specific test usernames you created.

## Vercel deployment

1. Create a hosted Postgres database. Neon is the simplest fit with Vercel because it has a Vercel Marketplace integration and a free tier.
2. Run `database/schema.sql` against a new hosted database, or run `database/migrations/001_post_replies.sql`, `database/migrations/002_quote_posts.sql`, `database/migrations/003_reposts.sql`, `database/migrations/004_discovery.sql`, `database/migrations/005_notifications.sql`, and `database/migrations/006_demo_accounts.sql` against an existing hosted database.
3. Import this repository into Vercel.
4. Add these Vercel environment variables:

   ```sh
   DATABASE_URL=your-hosted-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   CLIENT_URL=https://your-vercel-project.vercel.app
   NODE_ENV=production
   ```

5. Deploy. The frontend will call the backend at the same Vercel domain under `/api`.

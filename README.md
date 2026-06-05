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

Search at `/search?q=term` is a first-pass implementation that groups users, post content, and hashtags. Hashtag pages show posts associated with a tag. This is not a full ranking, trending, or autocomplete system yet, and mention notifications are intentionally left for a later feature.

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
```

The replies and quote-post migrations use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so they are safe to run against databases that may already have those columns. The reposts and discovery migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

## Vercel deployment

1. Create a hosted Postgres database. Neon is the simplest fit with Vercel because it has a Vercel Marketplace integration and a free tier.
2. Run `database/schema.sql` against a new hosted database, or run `database/migrations/001_post_replies.sql`, `database/migrations/002_quote_posts.sql`, `database/migrations/003_reposts.sql`, and `database/migrations/004_discovery.sql` against an existing hosted database.
3. Import this repository into Vercel.
4. Add these Vercel environment variables:

   ```sh
   DATABASE_URL=your-hosted-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   CLIENT_URL=https://your-vercel-project.vercel.app
   NODE_ENV=production
   ```

5. Deploy. The frontend will call the backend at the same Vercel domain under `/api`.

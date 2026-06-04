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
- Profile pages with user statistics, following/followers, and top-level posts
- Following/unfollowing of other users

## Replies / Threads

Replies are stored as normal posts with a nullable `parent_post_id`. The home timeline and profile post lists show top-level posts only. A post thread page at `/post/:id` shows the selected post and its direct replies ordered oldest-first.

The current implementation supports direct replies first. Deeper nested thread rendering is left as a future enhancement.

## Local development

1. Create `backend/.env` with your local database settings:

   ```sh
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB"
   JWT_SECRET="replace-with-a-long-random-secret"
   CLIENT_URL="http://localhost:5173"
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
```

The migration uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so it is safe to run against databases that may already have the replies column.

## Vercel deployment

1. Create a hosted Postgres database. Neon is the simplest fit with Vercel because it has a Vercel Marketplace integration and a free tier.
2. Run `database/schema.sql` against a new hosted database, or run `database/migrations/001_post_replies.sql` against an existing hosted database.
3. Import this repository into Vercel.
4. Add these Vercel environment variables:

   ```sh
   DATABASE_URL=your-hosted-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   CLIENT_URL=https://your-vercel-project.vercel.app
   NODE_ENV=production
   ```

5. Deploy. The frontend will call the backend at the same Vercel domain under `/api`.

<<<<<<< HEAD
————————————————
    Summary
————————————————

Blogging application inspired by Twitter/X.
Users can register accounts and create short posts that other users can see on a public timeline.
Users can follow each other and view profile pages that contain all of a user’s posts. 
The frontend is built with React and communicates with an Express REST API  to access a PostgreSQL database.

————————————————
    Features
————————————————

Secure login and registration using JWT and bcrypt hashing
Persistent login
Post creation and deletion showing timestamps and post authors
Timeline showing posts in chronological order
Profile pages for each registered user with user statistics, following/followers, and all of that users posts
Following/unfollowing of other users

————————————————
    Frontend
————————————————

React

Fetch API

————————————————
    Backend
————————————————

Node.js

Express

————————————————
    Database
————————————————

PostgreSQL

————————————————
 Authentication
————————————————

JSON Web Tokens(JWT)

bcrypt password hashing
=======
# Twitter Clone Deployment

This app deploys to Vercel as a Vite static frontend plus an Express API mounted at `/api`.

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

## Vercel deployment

1. Create a hosted Postgres database. Neon is the simplest fit with Vercel because it has a Vercel Marketplace integration and a free tier.
2. Run `database/schema.sql` against the hosted database.
3. Import this repository into Vercel.
4. Add these Vercel environment variables:

   ```sh
   DATABASE_URL=your-hosted-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   CLIENT_URL=https://your-vercel-project.vercel.app
   NODE_ENV=production
   ```

5. Deploy. The frontend will call the backend at the same Vercel domain under `/api`.
>>>>>>> aa113fd (predeployment)

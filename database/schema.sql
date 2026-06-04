CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content VARCHAR(280) NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  quote_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at
  ON posts (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_parent_post_id_created_at
  ON posts (parent_post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_posts_quote_post_id
  ON posts (quote_post_id);

CREATE INDEX IF NOT EXISTS idx_posts_top_level_created_at
  ON posts (created_at DESC)
  WHERE parent_post_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_follows_follower_id
  ON follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id
  ON follows (following_id);

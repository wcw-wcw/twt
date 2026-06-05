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

CREATE TABLE IF NOT EXISTS reposts (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS post_mentions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, mentioned_user_id)
);

CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  source_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_supported_type CHECK (type IN ('follow', 'reply', 'mention', 'quote', 'repost')),
  CONSTRAINT notifications_no_self_actor CHECK (actor_user_id IS NULL OR actor_user_id <> recipient_user_id)
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

CREATE INDEX IF NOT EXISTS idx_reposts_user_id_created_at
  ON reposts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reposts_post_id
  ON reposts (post_id);

CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id
  ON post_mentions (post_id);

CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned_user_id_created_at
  ON post_mentions (mentioned_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag
  ON hashtags (tag);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id
  ON post_hashtags (post_id);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id_created_at
  ON post_hashtags (hashtag_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_content_lower
  ON posts (LOWER(content));

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at
  ON notifications (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read_at
  ON notifications (recipient_user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_actor_user_id
  ON notifications (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_post_id
  ON notifications (post_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_follow
  ON notifications (recipient_user_id, actor_user_id, type)
  WHERE type = 'follow';

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_repost
  ON notifications (recipient_user_id, actor_user_id, post_id, type)
  WHERE type = 'repost';

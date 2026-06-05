CREATE TABLE IF NOT EXISTS post_mentions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, mentioned_user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id
  ON post_mentions (post_id);

CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned_user_id_created_at
  ON post_mentions (mentioned_user_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id
  ON post_hashtags (post_id);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id_created_at
  ON post_hashtags (hashtag_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag
  ON hashtags (tag);

CREATE INDEX IF NOT EXISTS idx_posts_content_lower
  ON posts (LOWER(content));

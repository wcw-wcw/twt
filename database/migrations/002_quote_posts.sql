ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS quote_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_quote_post_id
  ON posts (quote_post_id);

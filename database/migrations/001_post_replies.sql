ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_parent_post_id_created_at
  ON posts (parent_post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_posts_top_level_created_at
  ON posts (created_at DESC)
  WHERE parent_post_id IS NULL;

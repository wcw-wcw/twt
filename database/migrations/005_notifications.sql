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

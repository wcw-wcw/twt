const pool = require("../db")

const SUPPORTED_NOTIFICATION_TYPES = new Set([
  "follow",
  "reply",
  "mention",
  "quote",
  "repost"
])

const mapNotificationRow = (row) => ({
  id: row.id,
  type: row.type,
  readAt: row.read_at,
  createdAt: row.created_at,
  actor: row.actor_user_id ? {
    id: row.actor_user_id,
    username: row.actor_username,
    avatarUrl: row.actor_avatar_url,
    isDemo: Boolean(row.actor_is_demo),
    demoLabel: row.actor_demo_label
  } : null,
  postId: row.post_id,
  sourcePostId: row.source_post_id
})

const createNotification = async (client, {
  recipientUserId,
  actorUserId,
  type,
  postId = null,
  sourcePostId = null
}) => {
  if (!recipientUserId || !actorUserId || recipientUserId === actorUserId) {
    return null
  }

  if (!SUPPORTED_NOTIFICATION_TYPES.has(type)) {
    throw new Error(`Unsupported notification type: ${type}`)
  }

  // Partial unique indexes dedupe follow/repost notifications. Other types may
  // repeat because separate replies, quotes, and mentions can target the same post.
  const result = await client.query(
    `
      INSERT INTO notifications (
        recipient_user_id,
        actor_user_id,
        type,
        post_id,
        source_post_id
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [recipientUserId, actorUserId, type, postId, sourcePostId]
  )

  return result.rows[0] || null
}

const createMentionNotifications = async (client, {
  mentionedUsers,
  actorUserId,
  sourcePostId,
  postId = null
}) => {
  const uniqueRecipients = new Set()

  for (const user of mentionedUsers || []) {
    if (!user?.id || uniqueRecipients.has(user.id)) continue

    uniqueRecipients.add(user.id)
    await createNotification(client, {
      recipientUserId: user.id,
      actorUserId,
      type: "mention",
      postId,
      sourcePostId
    })
  }
}

const getNotificationsForUser = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        n.id,
        n.type,
        n.post_id,
        n.source_post_id,
        n.read_at,
        n.created_at,
        actor.id AS actor_user_id,
        actor.username AS actor_username,
        actor.avatar_url AS actor_avatar_url,
        actor.is_demo AS actor_is_demo,
        actor.demo_label AS actor_demo_label
      FROM notifications n
      LEFT JOIN users actor ON actor.id = n.actor_user_id
      WHERE n.recipient_user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 100
    `,
    [userId]
  )

  return result.rows.map(mapNotificationRow)
}

const getUnreadNotificationCount = async (userId) => {
  const result = await pool.query(
    `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE recipient_user_id = $1
        AND read_at IS NULL
    `,
    [userId]
  )

  return Number(result.rows[0]?.unread_count || 0)
}

const markNotificationRead = async (userId, notificationId) => {
  const result = await pool.query(
    `
      UPDATE notifications
      SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = $1
        AND recipient_user_id = $2
      RETURNING id, read_at
    `,
    [notificationId, userId]
  )

  return result.rows[0] || null
}

const markAllNotificationsRead = async (userId) => {
  const result = await pool.query(
    `
      UPDATE notifications
      SET read_at = CURRENT_TIMESTAMP
      WHERE recipient_user_id = $1
        AND read_at IS NULL
    `,
    [userId]
  )

  return result.rowCount
}

module.exports = {
  createMentionNotifications,
  createNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
}

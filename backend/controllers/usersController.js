const pool = require("../db")
const { createNotification } = require("../lib/notifications")
const {
  basePostGroupBy,
  basePostSelect,
  mapPostRow
} = require("../lib/postRows")

exports.getUserProfile = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `
        SELECT
          u.id,
          u.username,
          u.email,
          u.avatar_url,
          u.created_at,
          (
            SELECT COUNT(*)
            FROM posts p
            WHERE p.author_id = u.id
              AND p.parent_post_id IS NULL
          ) AS post_count,
          (
            SELECT COUNT(*)
            FROM follows f
            WHERE f.following_id = u.id
          ) AS follower_count,
          (
            SELECT COUNT(*)
            FROM follows f
            WHERE f.follower_id = u.id
          ) AS following_count
        FROM users u
        WHERE u.id = $1
      `,
      [id]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      counts: {
        posts: Number(user.post_count),
        followers: Number(user.follower_count),
        following: Number(user.following_count)
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch user profile" })
  }
}

exports.getUserPosts = async (req, res) => {
  const { id } = req.params
  const currentUserId = req.user?.id

  try {
    const result = await pool.query(
      `
        WITH profile_timeline AS (
          SELECT
            p.id,
            p.content,
            p.parent_post_id,
            p.quote_post_id,
            p.created_at,
            p.created_at AS timeline_created_at,
            NULL::timestamp AS reposted_at,
            NULL::uuid AS reposted_by_id,
            NULL::varchar AS reposted_by_username,
            NULL::text AS reposted_by_avatar_url
          FROM posts p
          WHERE p.author_id = $1
            AND p.parent_post_id IS NULL

          UNION ALL

          SELECT
            p.id,
            p.content,
            p.parent_post_id,
            p.quote_post_id,
            p.created_at,
            r.created_at AS timeline_created_at,
            r.created_at AS reposted_at,
            repost_user.id AS reposted_by_id,
            repost_user.username AS reposted_by_username,
            repost_user.avatar_url AS reposted_by_avatar_url
          FROM reposts r
          JOIN posts p ON p.id = r.post_id
          JOIN users repost_user ON repost_user.id = r.user_id
          WHERE r.user_id = $1
            AND p.parent_post_id IS NULL
            AND p.author_id <> $1
        )
        SELECT
          pt.reposted_at,
          pt.reposted_by_id,
          pt.reposted_by_username,
          pt.reposted_by_avatar_url,
          ${basePostSelect(currentUserId ? "$2" : null)}
        FROM profile_timeline pt
        JOIN posts p ON p.id = pt.id
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts replies ON replies.parent_post_id = pt.id
        LEFT JOIN posts quoted ON quoted.id = pt.quote_post_id
        LEFT JOIN users quoted_user ON quoted_user.id = quoted.author_id
        GROUP BY
          pt.id,
          pt.content,
          pt.parent_post_id,
          pt.quote_post_id,
          pt.created_at,
          pt.timeline_created_at,
          pt.reposted_at,
          pt.reposted_by_id,
          pt.reposted_by_username,
          pt.reposted_by_avatar_url,
          ${basePostGroupBy}
        ORDER BY pt.timeline_created_at DESC
      `,
      currentUserId ? [id, currentUserId] : [id]
    )

    return res.json(result.rows.map(mapPostRow))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch user posts" })
  }
}

exports.followUser = async (req, res) => {
  const followerId = req.user.id
  const followingId = req.params.id

  if (followerId === followingId) {
    return res.status(400).json({ error: "You cannot follow yourself" })
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const targetResult = await client.query(
      `SELECT id FROM users WHERE id = $1`,
      [followingId]
    )

    if (targetResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "User not found" })
    }

    const followResult = await client.query(
      `
        INSERT INTO follows (follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING follower_id
      `,
      [followerId, followingId]
    )

    if (followResult.rows.length > 0) {
      await createNotification(client, {
        recipientUserId: followingId,
        actorUserId: followerId,
        type: "follow"
      })
    }

    await client.query("COMMIT")

    return res.status(201).json({ success: true })
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error)
    return res.status(500).json({ error: "Failed to follow user" })
  } finally {
    client.release()
  }
}

exports.unfollowUser = async (req, res) => {
  const followerId = req.user.id
  const followingId = req.params.id

  try {
    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    )

    return res.json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to unfollow user" })
  }
}

exports.getFollowers = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `
        SELECT u.id, u.username, u.avatar_url, u.created_at
        FROM follows f
        JOIN users u ON u.id = f.follower_id
        WHERE f.following_id = $1
        ORDER BY u.username ASC
      `,
      [id]
    )

    return res.json(result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at
    })))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch followers" })
  }
}

exports.getFollowing = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `
        SELECT u.id, u.username, u.avatar_url, u.created_at
        FROM follows f
        JOIN users u ON u.id = f.following_id
        WHERE f.follower_id = $1
        ORDER BY u.username ASC
      `,
      [id]
    )

    return res.json(result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at
    })))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch following list" })
  }
}

const pool = require("../db")

const mapPostRow = (row) => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  parentPostId: row.parent_post_id,
  quotePostId: row.quote_post_id,
  replyCount: Number(row.reply_count || 0),
  quotedPost: row.quoted_post_id ? {
    id: row.quoted_post_id,
    content: row.quoted_content,
    createdAt: row.quoted_created_at,
    author: {
      id: row.quoted_author_id,
      username: row.quoted_username,
      avatarUrl: row.quoted_avatar_url
    }
  } : null,
  author: {
    id: row.author_id,
    username: row.username,
    avatarUrl: row.avatar_url
  }
})

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

  try {
    const result = await pool.query(
      `
        SELECT
          p.id,
          p.content,
          p.parent_post_id,
          p.quote_post_id,
          p.created_at,
          COUNT(replies.id) AS reply_count,
          u.id AS author_id,
          u.username,
          u.avatar_url,
          quoted.id AS quoted_post_id,
          quoted.content AS quoted_content,
          quoted.created_at AS quoted_created_at,
          quoted_user.id AS quoted_author_id,
          quoted_user.username AS quoted_username,
          quoted_user.avatar_url AS quoted_avatar_url
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts replies ON replies.parent_post_id = p.id
        LEFT JOIN posts quoted ON quoted.id = p.quote_post_id
        LEFT JOIN users quoted_user ON quoted_user.id = quoted.author_id
        WHERE p.author_id = $1
          AND p.parent_post_id IS NULL
        GROUP BY p.id, u.id, quoted.id, quoted_user.id
        ORDER BY p.created_at DESC
      `,
      [id]
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

  try {
    const targetResult = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [followingId]
    )

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    await pool.query(
      `
        INSERT INTO follows (follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [followerId, followingId]
    )

    return res.status(201).json({ success: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to follow user" })
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

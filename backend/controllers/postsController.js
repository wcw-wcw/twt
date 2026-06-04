const pool = require("../db")

const mapPostRow = (row) => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  parentPostId: row.parent_post_id,
  replyCount: Number(row.reply_count || 0),
  author: {
    id: row.author_id,
    username: row.username,
    avatarUrl: row.avatar_url
  }
})

exports.getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        posts.id,
        posts.content,
        posts.parent_post_id,
        posts.created_at,
        COUNT(replies.id) AS reply_count,
        users.id AS author_id,
        users.username,
        users.avatar_url
      FROM posts
      JOIN users ON posts.author_id = users.id
      LEFT JOIN posts replies ON replies.parent_post_id = posts.id
      WHERE posts.parent_post_id IS NULL
      GROUP BY posts.id, users.id
      ORDER BY posts.created_at DESC
    `)

    return res.json(result.rows.map(mapPostRow))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Server error" })
  }
}

exports.createPost = async (req, res) => {
  const content = req.body.content?.trim()
  const userId = req.user.id

  if (!content) {
    return res.status(400).json({ error: "Post content is required" })
  }

  if (content.length > 280) {
    return res.status(400).json({ error: "Post content cannot exceed 280 characters" })
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO posts (content, author_id)
        VALUES ($1, $2)
        RETURNING id, content, parent_post_id, created_at, author_id
      `,
      [content, userId]
    )

    const userResult = await pool.query(
      `SELECT id, username, avatar_url FROM users WHERE id = $1`,
      [userId]
    )

    const post = result.rows[0]
    const author = userResult.rows[0]

    return res.status(201).json({
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      parentPostId: post.parent_post_id,
      replyCount: 0,
      author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatar_url
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to create post" })
  }
}

exports.getThread = async (req, res) => {
  const { id } = req.params

  try {
    const postResult = await pool.query(
      `
        SELECT
          p.id,
          p.content,
          p.parent_post_id,
          p.created_at,
          COUNT(replies.id) AS reply_count,
          u.id AS author_id,
          u.username,
          u.avatar_url
        FROM posts p
        JOIN users u ON p.author_id = u.id
        LEFT JOIN posts replies ON replies.parent_post_id = p.id
        WHERE p.id = $1
        GROUP BY p.id, u.id
      `,
      [id]
    )

    const post = postResult.rows[0]

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const repliesResult = await pool.query(
      `
        SELECT
          p.id,
          p.content,
          p.parent_post_id,
          p.created_at,
          COUNT(child_replies.id) AS reply_count,
          u.id AS author_id,
          u.username,
          u.avatar_url
        FROM posts p
        JOIN users u ON p.author_id = u.id
        LEFT JOIN posts child_replies ON child_replies.parent_post_id = p.id
        WHERE p.parent_post_id = $1
        GROUP BY p.id, u.id
        ORDER BY p.created_at ASC
      `,
      [id]
    )

    return res.json({
      post: mapPostRow(post),
      replies: repliesResult.rows.map(mapPostRow)
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch thread" })
  }
}

exports.createReply = async (req, res) => {
  const { id } = req.params
  const content = req.body.content?.trim()
  const userId = req.user.id

  if (!content) {
    return res.status(400).json({ error: "Reply content is required" })
  }

  if (content.length > 280) {
    return res.status(400).json({ error: "Reply content cannot exceed 280 characters" })
  }

  try {
    const parentResult = await pool.query(
      `SELECT id FROM posts WHERE id = $1`,
      [id]
    )

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" })
    }

    const result = await pool.query(
      `
        INSERT INTO posts (content, author_id, parent_post_id)
        VALUES ($1, $2, $3)
        RETURNING id, content, parent_post_id, created_at, author_id
      `,
      [content, userId, id]
    )

    const userResult = await pool.query(
      `SELECT id, username, avatar_url FROM users WHERE id = $1`,
      [userId]
    )

    const reply = result.rows[0]
    const author = userResult.rows[0]

    return res.status(201).json({
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      parentPostId: reply.parent_post_id,
      replyCount: 0,
      author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatar_url
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to create reply" })
  }
}

exports.deletePost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const postResult = await pool.query(
      `SELECT id, author_id FROM posts WHERE id = $1`,
      [id]
    )

    const post = postResult.rows[0]

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    if (post.author_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" })
    }

    await pool.query(`DELETE FROM posts WHERE id = $1`, [id])

    return res.json({ success: true, deletedPostId: id })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to delete post" })
  }
}

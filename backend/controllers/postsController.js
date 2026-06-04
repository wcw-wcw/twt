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

const basePostSelect = `
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
`

const basePostJoins = `
  JOIN users u ON p.author_id = u.id
  LEFT JOIN posts replies ON replies.parent_post_id = p.id
  LEFT JOIN posts quoted ON quoted.id = p.quote_post_id
  LEFT JOIN users quoted_user ON quoted_user.id = quoted.author_id
`

const basePostGroupBy = `
  p.id,
  u.id,
  quoted.id,
  quoted_user.id
`

exports.getPosts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ${basePostSelect}
      FROM posts p
      ${basePostJoins}
      WHERE p.parent_post_id IS NULL
      GROUP BY ${basePostGroupBy}
      ORDER BY p.created_at DESC
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
        RETURNING id, content, parent_post_id, quote_post_id, created_at, author_id
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
      quotePostId: post.quote_post_id,
      quotedPost: null,
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
          ${basePostSelect}
        FROM posts p
        ${basePostJoins}
        WHERE p.id = $1
        GROUP BY ${basePostGroupBy}
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
          ${basePostSelect}
        FROM posts p
        ${basePostJoins}
        WHERE p.parent_post_id = $1
        GROUP BY ${basePostGroupBy}
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
        RETURNING id, content, parent_post_id, quote_post_id, created_at, author_id
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
      quotePostId: reply.quote_post_id,
      quotedPost: null,
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

exports.createQuote = async (req, res) => {
  const { id } = req.params
  const content = req.body.content?.trim()
  const userId = req.user.id

  if (!content) {
    return res.status(400).json({ error: "Quote content is required" })
  }

  if (content.length > 280) {
    return res.status(400).json({ error: "Quote content cannot exceed 280 characters" })
  }

  try {
    const quotedResult = await pool.query(
      `SELECT id FROM posts WHERE id = $1`,
      [id]
    )

    if (quotedResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" })
    }

    const result = await pool.query(
      `
        INSERT INTO posts (content, author_id, parent_post_id, quote_post_id)
        VALUES ($1, $2, NULL, $3)
        RETURNING id
      `,
      [content, userId, id]
    )

    const postResult = await pool.query(
      `
        SELECT
          ${basePostSelect}
        FROM posts p
        ${basePostJoins}
        WHERE p.id = $1
        GROUP BY ${basePostGroupBy}
      `,
      [result.rows[0].id]
    )

    return res.status(201).json(mapPostRow(postResult.rows[0]))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to create quote post" })
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

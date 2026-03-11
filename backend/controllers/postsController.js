const pool = require("../db")

const mapPostRow = (row) => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
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
        posts.created_at,
        users.id AS author_id,
        users.username,
        users.avatar_url
      FROM posts
      JOIN users ON posts.author_id = users.id
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
        RETURNING id, content, created_at, author_id
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
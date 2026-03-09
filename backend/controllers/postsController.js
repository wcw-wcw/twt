const pool = require("../db")

exports.getPosts = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
        posts.id,
        posts.content,
        posts.created_at,
        users.id AS author_id,
        users.username
      FROM posts
      JOIN users ON posts.author_id = users.id
      ORDER BY posts.created_at DESC
    `)

    const posts = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      author: {
        id: row.author_id,
        username: row.username,
        avatar: "/default-avatar.png"
      }
    }))

    res.json(posts)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


exports.createPost = async (req, res) => {

  const { content } = req.body
  const userId = req.user.id   // 🔐 comes from JWT middleware

  try {

    const result = await pool.query(`
      INSERT INTO posts (content, author_id)
      VALUES ($1, $2)
      RETURNING *
    `, [content, userId])

    const post = result.rows[0]

    const user = await pool.query(
      `SELECT id, username FROM users WHERE id = $1`,
      [userId]
    )

    res.json({
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      author: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        avatar: "/default-avatar.png"
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create post" })
  }

}


exports.deletePost = async (req, res) => {

  const { id } = req.params

  try {

    await pool.query(
      "DELETE FROM posts WHERE id = $1",
      [id]
    )

    res.json({ success: true })

  } catch (err) {

    console.error(err)

    res.status(500).json({ error: "Failed to delete" })

  }

}
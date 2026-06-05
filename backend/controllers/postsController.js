const pool = require("../db")
const { savePostDiscovery } = require("../lib/discovery")
const {
  basePostGroupBy,
  basePostJoins,
  basePostSelect,
  mapPostRow
} = require("../lib/postRows")

const fetchPostById = async (client, postId, currentUserId) => {
  const currentUserParam = currentUserId ? "$2" : null
  const result = await client.query(
    `
      SELECT
        ${basePostSelect(currentUserParam)}
      FROM posts p
      ${basePostJoins}
      WHERE p.id = $1
      GROUP BY ${basePostGroupBy}
    `,
    currentUserId ? [postId, currentUserId] : [postId]
  )

  return result.rows[0] ? mapPostRow(result.rows[0]) : null
}

exports.getPosts = async (req, res) => {
  const currentUserId = req.user?.id
  const currentUserParam = currentUserId ? "$1" : null

  try {
    const result = await pool.query(`
      SELECT
        ${basePostSelect(currentUserParam)}
      FROM posts p
      ${basePostJoins}
      WHERE p.parent_post_id IS NULL
      GROUP BY ${basePostGroupBy}
      ORDER BY p.created_at DESC
    `, currentUserId ? [currentUserId] : [])

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

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const result = await client.query(
      `
        INSERT INTO posts (content, author_id)
        VALUES ($1, $2)
        RETURNING id
      `,
      [content, userId]
    )

    await savePostDiscovery(client, result.rows[0].id, content)
    const post = await fetchPostById(client, result.rows[0].id, userId)

    await client.query("COMMIT")

    return res.status(201).json(post)
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error)
    return res.status(500).json({ error: "Failed to create post" })
  } finally {
    client.release()
  }
}

exports.getThread = async (req, res) => {
  const { id } = req.params
  const currentUserId = req.user?.id
  const currentUserParam = currentUserId ? "$2" : null
  const queryParams = currentUserId ? [id, currentUserId] : [id]

  try {
    const postResult = await pool.query(
      `
        SELECT
          ${basePostSelect(currentUserParam)}
        FROM posts p
        ${basePostJoins}
        WHERE p.id = $1
        GROUP BY ${basePostGroupBy}
      `,
      queryParams
    )

    const post = postResult.rows[0]

    if (!post) {
      return res.status(404).json({ error: "Post not found" })
    }

    const repliesResult = await pool.query(
      `
        SELECT
          ${basePostSelect(currentUserParam)}
        FROM posts p
        ${basePostJoins}
        WHERE p.parent_post_id = $1
        GROUP BY ${basePostGroupBy}
        ORDER BY p.created_at ASC
      `,
      queryParams
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

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const parentResult = await client.query(
      `SELECT id FROM posts WHERE id = $1`,
      [id]
    )

    if (parentResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Post not found" })
    }

    const result = await client.query(
      `
        INSERT INTO posts (content, author_id, parent_post_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [content, userId, id]
    )

    await savePostDiscovery(client, result.rows[0].id, content)
    const reply = await fetchPostById(client, result.rows[0].id, userId)

    await client.query("COMMIT")

    return res.status(201).json(reply)
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error)
    return res.status(500).json({ error: "Failed to create reply" })
  } finally {
    client.release()
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

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const quotedResult = await client.query(
      `SELECT id FROM posts WHERE id = $1`,
      [id]
    )

    if (quotedResult.rows.length === 0) {
      await client.query("ROLLBACK")
      return res.status(404).json({ error: "Post not found" })
    }

    const result = await client.query(
      `
        INSERT INTO posts (content, author_id, parent_post_id, quote_post_id)
        VALUES ($1, $2, NULL, $3)
        RETURNING id
      `,
      [content, userId, id]
    )

    await savePostDiscovery(client, result.rows[0].id, content)
    const post = await fetchPostById(client, result.rows[0].id, userId)

    await client.query("COMMIT")

    return res.status(201).json(post)
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error)
    return res.status(500).json({ error: "Failed to create quote post" })
  } finally {
    client.release()
  }
}

exports.repostPost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const postResult = await pool.query(
      `SELECT id FROM posts WHERE id = $1`,
      [id]
    )

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" })
    }

    await pool.query(
      `
        INSERT INTO reposts (user_id, post_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, post_id) DO NOTHING
      `,
      [userId, id]
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) AS repost_count FROM reposts WHERE post_id = $1`,
      [id]
    )

    return res.status(201).json({
      success: true,
      postId: id,
      repostCount: Number(countResult.rows[0].repost_count || 0),
      hasReposted: true
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to repost" })
  }
}

exports.unrepostPost = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    await pool.query(
      `DELETE FROM reposts WHERE user_id = $1 AND post_id = $2`,
      [userId, id]
    )

    const countResult = await pool.query(
      `SELECT COUNT(*) AS repost_count FROM reposts WHERE post_id = $1`,
      [id]
    )

    return res.json({
      success: true,
      postId: id,
      repostCount: Number(countResult.rows[0].repost_count || 0),
      hasReposted: false
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to undo repost" })
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

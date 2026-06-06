const pool = require("../db")
const {
  basePostGroupBy,
  basePostJoins,
  basePostSelect,
  mapPostRow
} = require("../lib/postRows")

const normalizeQuery = (query) => String(query || "").trim().slice(0, 80)

exports.search = async (req, res) => {
  const q = normalizeQuery(req.query.q)
  const currentUserId = req.user?.id

  if (!q) {
    return res.json({
      users: [],
      posts: [],
      hashtags: []
    })
  }

  const pattern = `%${q.toLowerCase()}%`
  const currentUserParam = currentUserId ? "$2" : null
  const postParams = currentUserId ? [pattern, currentUserId] : [pattern]

  try {
    const [usersResult, postsResult, hashtagsResult] = await Promise.all([
      pool.query(
        `
          SELECT id, username, avatar_url, is_demo, demo_label
          FROM users
          WHERE LOWER(username) LIKE $1
          ORDER BY username ASC
          LIMIT 10
        `,
        [pattern]
      ),
      pool.query(
        `
          SELECT
            ${basePostSelect(currentUserParam)}
          FROM posts p
          ${basePostJoins}
          WHERE LOWER(p.content) LIKE $1
          GROUP BY ${basePostGroupBy}
          ORDER BY p.created_at DESC
          LIMIT 20
        `,
        postParams
      ),
      pool.query(
        `
          SELECT
            h.id,
            h.tag,
            COUNT(ph.post_id) AS post_count
          FROM hashtags h
          LEFT JOIN post_hashtags ph ON ph.hashtag_id = h.id
          WHERE LOWER(h.tag) LIKE $1
          GROUP BY h.id
          ORDER BY COUNT(ph.post_id) DESC, h.tag ASC
          LIMIT 20
        `,
        [pattern.replace(/^%#/, "%")]
      )
    ])

    return res.json({
      users: usersResult.rows.map((user) => ({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatar_url,
        isDemo: Boolean(user.is_demo),
        demoLabel: user.demo_label
      })),
      posts: postsResult.rows.map(mapPostRow),
      hashtags: hashtagsResult.rows.map((hashtag) => ({
        id: hashtag.id,
        tag: hashtag.tag,
        postCount: Number(hashtag.post_count || 0)
      }))
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to search" })
  }
}

exports.getHashtagPosts = async (req, res) => {
  const tag = normalizeQuery(req.params.tag).replace(/^#/, "").toLowerCase()
  const currentUserId = req.user?.id

  if (!tag) {
    return res.json([])
  }

  const currentUserParam = currentUserId ? "$2" : null

  try {
    const result = await pool.query(
      `
        SELECT
          ${basePostSelect(currentUserParam)}
        FROM hashtags h
        JOIN post_hashtags ph ON ph.hashtag_id = h.id
        JOIN posts p ON p.id = ph.post_id
        ${basePostJoins}
        WHERE h.tag = $1
        GROUP BY ${basePostGroupBy}, ph.created_at
        ORDER BY ph.created_at DESC
        LIMIT 50
      `,
      currentUserId ? [tag, currentUserId] : [tag]
    )

    return res.json(result.rows.map(mapPostRow))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch hashtag posts" })
  }
}

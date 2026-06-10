const USERNAME_PATTERN = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,50})/g
const HASHTAG_PATTERN = /(^|[^A-Za-z0-9_])#([A-Za-z0-9_]{1,50})/g

const extractMentions = (content) => {
  const mentions = new Map()

  for (const match of content.matchAll(USERNAME_PATTERN)) {
    const username = match[2]
    const key = username.toLowerCase()

    if (!mentions.has(key)) {
      mentions.set(key, username)
    }
  }

  return Array.from(mentions.values())
}

const extractHashtags = (content) => {
  const hashtags = new Set()

  for (const match of content.matchAll(HASHTAG_PATTERN)) {
    hashtags.add(match[2].toLowerCase())
  }

  return Array.from(hashtags)
}

const savePostDiscovery = async (client, postId, content) => {
  const mentions = extractMentions(content)
  const hashtags = extractHashtags(content)
  const mentionedUsers = []

  if (mentions.length > 0) {
    // Mentions resolve existing users only. Unknown @text stays display text
    // and does not create rows or notifications.
    const usersResult = await client.query(
      `
        SELECT id, username
        FROM users
        WHERE LOWER(username) = ANY($1::text[])
      `,
      [mentions.map((mention) => mention.toLowerCase())]
    )

    for (const user of usersResult.rows) {
      await client.query(
        `
          INSERT INTO post_mentions (post_id, mentioned_user_id, mention_text)
          VALUES ($1, $2, $3)
          ON CONFLICT (post_id, mentioned_user_id) DO NOTHING
        `,
        [postId, user.id, user.username]
      )
      mentionedUsers.push(user)
    }
  }

  for (const tag of hashtags) {
    // Hashtags are canonicalized lowercase so /hashtag/:tag can be exact-match.
    const hashtagResult = await client.query(
      `
        INSERT INTO hashtags (tag)
        VALUES ($1)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
        RETURNING id
      `,
      [tag]
    )

    await client.query(
      `
        INSERT INTO post_hashtags (post_id, hashtag_id)
        VALUES ($1, $2)
        ON CONFLICT (post_id, hashtag_id) DO NOTHING
      `,
      [postId, hashtagResult.rows[0].id]
    )
  }

  return {
    mentionedUsers,
    hashtags
  }
}

module.exports = {
  extractHashtags,
  extractMentions,
  savePostDiscovery
}

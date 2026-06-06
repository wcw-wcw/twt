const bcrypt = require("bcrypt")
const crypto = require("crypto")

const pool = require("../db")
const { savePostDiscovery } = require("../lib/discovery")

const DEMO_LABEL = "Simulated demo account"

const demoUsers = [
  {
    key: "frontend",
    username: "demo_frontend_mira",
    email: "demo_frontend_mira@example.invalid"
  },
  {
    key: "gamedev",
    username: "demo_indie_game_ren",
    email: "demo_indie_game_ren@example.invalid"
  },
  {
    key: "anime",
    username: "demo_anime_sora",
    email: "demo_anime_sora@example.invalid"
  },
  {
    key: "markets",
    username: "demo_market_ivy",
    email: "demo_market_ivy@example.invalid"
  },
  {
    key: "security",
    username: "demo_cyber_noah",
    email: "demo_cyber_noah@example.invalid"
  },
  {
    key: "backend",
    username: "demo_backend_jules",
    email: "demo_backend_jules@example.invalid"
  },
  {
    key: "designer",
    username: "demo_ui_lena",
    email: "demo_ui_lena@example.invalid"
  },
  {
    key: "data",
    username: "demo_data_kai",
    email: "demo_data_kai@example.invalid"
  },
  {
    key: "cloud",
    username: "demo_cloud_ari",
    email: "demo_cloud_ari@example.invalid"
  },
  {
    key: "community",
    username: "demo_community_tess",
    email: "demo_community_tess@example.invalid"
  }
]

const topLevelPosts = [
  {
    key: "frontend-dashboard",
    author: "frontend",
    content: "Polishing a dark-mode activity dashboard today. Tiny spacing fixes made the whole feed feel calmer. #frontend #uidesign"
  },
  {
    key: "game-loop",
    author: "gamedev",
    content: "Prototype milestone: the tiny platformer finally has forgiving jump timing. @demo_ui_lena gave the button states a much better feel. #indiedev #gamedev"
  },
  {
    key: "anime-watchlist",
    author: "anime",
    content: "Weekend watchlist is all cozy sci-fi and tournament arcs. Keeping notes for a recommendation thread. #anime #watchlist"
  },
  {
    key: "market-notes",
    author: "markets",
    content: "Paper-trading note: writing down the thesis before the chart keeps me honest. No real trades here, just demo portfolio practice. #markets #learning"
  },
  {
    key: "security-lab",
    author: "security",
    content: "Set up a local password-audit lab with intentionally fake data. The safest playground is one that cannot touch production. #cybersecurity #student"
  },
  {
    key: "api-cache",
    author: "backend",
    content: "Added cache headers to a toy API and cut repeat load times in half. @demo_cloud_ari reminded me to measure before celebrating. #backend #postgres"
  },
  {
    key: "design-system",
    author: "designer",
    content: "Today I named the neutral colors after their job instead of their vibe: surface, border, text, hint. Future me is grateful. #uidesign #designsystems"
  },
  {
    key: "data-notebook",
    author: "data",
    content: "Learning notebook update: plotted sample app events and finally understood why clean labels matter. #datascience #learning"
  },
  {
    key: "cloud-deploy",
    author: "cloud",
    content: "Demo deploy checklist: env vars, health check, rollback note, and one boring README paragraph. Boring is reliable. #cloud #devops"
  },
  {
    key: "community-prompt",
    author: "community",
    content: "Prompt for the demo community: what feature made your project feel real this week? Tag a teammate and share the tiny win. #community #buildinpublic"
  },
  {
    key: "cross-stack",
    author: "frontend",
    content: "Paired with @demo_backend_jules on the post composer flow. The frontend got simpler once the API errors got friendlier. #frontend #backend"
  },
  {
    key: "search-demo",
    author: "data",
    content: "Seeded hashtags are perfect for testing search: try #frontend, #cloud, #anime, or #community in this demo. #search #demo"
  }
]

const replies = [
  {
    key: "reply-dashboard-design",
    author: "designer",
    parent: "frontend-dashboard",
    content: "The calmer feed really shows. The contrast feels portfolio-ready without shouting. #uidesign"
  },
  {
    key: "reply-dashboard-backend",
    author: "backend",
    parent: "frontend-dashboard",
    content: "I like how the UI makes room for metadata without making the post feel busy. #frontend"
  },
  {
    key: "reply-game-anime",
    author: "anime",
    parent: "game-loop",
    content: "Forgiving jump timing is the difference between fun and homework. Would play this demo. #gamedev"
  },
  {
    key: "reply-market-data",
    author: "data",
    parent: "market-notes",
    content: "Writing the thesis first is basically data labeling for your future self. #learning"
  },
  {
    key: "reply-security-cloud",
    author: "cloud",
    parent: "security-lab",
    content: "Local fake data labs are the best labs. Nothing external, nothing scary, still useful. #cybersecurity"
  },
  {
    key: "reply-api-cloud",
    author: "cloud",
    parent: "api-cache",
    content: "Measure first, celebrate second, document third. Then coffee. #devops"
  },
  {
    key: "reply-community-frontend",
    author: "frontend",
    parent: "community-prompt",
    content: "My tiny win was making notification badges update after read actions. Small detail, big polish. #buildinpublic"
  },
  {
    key: "reply-search-anime",
    author: "anime",
    parent: "search-demo",
    content: "Search for #anime too. This sample account insists. #anime #demo"
  }
]

const quotes = [
  {
    key: "quote-dashboard",
    author: "community",
    quoted: "frontend-dashboard",
    content: "This is exactly the kind of small polish that makes a demo feel alive. #community"
  },
  {
    key: "quote-security",
    author: "security",
    quoted: "cloud-deploy",
    content: "A rollback note belongs in every demo checklist. Future incident-you says thanks. #devops"
  },
  {
    key: "quote-search",
    author: "frontend",
    quoted: "search-demo",
    content: "Seeded search data is doing real work here: users, hashtags, posts, and mentions all in one pass. #search"
  },
  {
    key: "quote-game",
    author: "designer",
    quoted: "game-loop",
    content: "Button states and jump timing are cousins. Both are about trust. #gamedev #uidesign"
  },
  {
    key: "quote-market",
    author: "markets",
    quoted: "data-notebook",
    content: "Clean labels turn charts from decoration into decisions, even in sample data. #datascience"
  }
]

const follows = [
  ["frontend", "designer"],
  ["frontend", "backend"],
  ["designer", "frontend"],
  ["backend", "cloud"],
  ["cloud", "backend"],
  ["security", "cloud"],
  ["data", "markets"],
  ["markets", "data"],
  ["anime", "gamedev"],
  ["gamedev", "designer"],
  ["community", "frontend"],
  ["community", "anime"],
  ["backend", "security"],
  ["cloud", "community"],
  ["data", "frontend"]
]

const reposts = [
  ["backend", "frontend-dashboard"],
  ["designer", "game-loop"],
  ["frontend", "design-system"],
  ["cloud", "security-lab"],
  ["markets", "data-notebook"],
  ["anime", "search-demo"],
  ["community", "api-cache"],
  ["security", "cloud-deploy"]
]

const emptyCounts = () => ({
  usersCreated: 0,
  usersFound: 0,
  postsCreated: 0,
  postsFound: 0,
  followsCreated: 0,
  followsFound: 0,
  repliesCreated: 0,
  repliesFound: 0,
  quotesCreated: 0,
  quotesFound: 0,
  repostsCreated: 0,
  repostsFound: 0,
  notificationsCreated: 0,
  notificationsFound: 0,
  discoveryProcessed: 0
})

const userByKey = new Map()
const postByKey = new Map()

const ensureDemoUser = async (client, demoUser, passwordHash, counts) => {
  const existing = await client.query(
    `
      SELECT id, username, email, is_demo, demo_label
      FROM users
      WHERE username = $1 OR email = $2
    `,
    [demoUser.username, demoUser.email]
  )

  if (existing.rows.length > 0) {
    const user = existing.rows[0]

    if (!user.is_demo) {
      throw new Error(`Refusing to modify non-demo user collision: ${demoUser.username}`)
    }

    await client.query(
      `
        UPDATE users
        SET demo_label = $2
        WHERE id = $1
      `,
      [user.id, DEMO_LABEL]
    )
    counts.usersFound += 1
    userByKey.set(demoUser.key, { ...user, demo_label: DEMO_LABEL })
    return
  }

  const result = await client.query(
    `
      INSERT INTO users (username, email, password_hash, is_demo, demo_label)
      VALUES ($1, $2, $3, TRUE, $4)
      RETURNING id, username, email, is_demo, demo_label
    `,
    [demoUser.username, demoUser.email, passwordHash, DEMO_LABEL]
  )

  counts.usersCreated += 1
  userByKey.set(demoUser.key, result.rows[0])
}

const ensurePost = async (client, { author, content, parentPostId = null, quotePostId = null }, counts, counterName) => {
  const authorUser = userByKey.get(author)

  const existing = await client.query(
    `
      SELECT id, author_id, content, parent_post_id, quote_post_id
      FROM posts
      WHERE author_id = $1
        AND content = $2
        AND parent_post_id IS NOT DISTINCT FROM $3
        AND quote_post_id IS NOT DISTINCT FROM $4
    `,
    [authorUser.id, content, parentPostId, quotePostId]
  )

  if (existing.rows.length > 0) {
    counts[counterName.found] += 1
    return existing.rows[0]
  }

  const result = await client.query(
    `
      INSERT INTO posts (author_id, content, parent_post_id, quote_post_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, author_id, content, parent_post_id, quote_post_id
    `,
    [authorUser.id, content, parentPostId, quotePostId]
  )

  counts[counterName.created] += 1
  return result.rows[0]
}

const ensureNotification = async (client, {
  recipientUserId,
  actorUserId,
  type,
  postId = null,
  sourcePostId = null
}, counts) => {
  if (!recipientUserId || !actorUserId || recipientUserId === actorUserId) {
    return
  }

  const existing = await client.query(
    `
      SELECT id
      FROM notifications
      WHERE recipient_user_id = $1
        AND actor_user_id = $2
        AND type = $3
        AND post_id IS NOT DISTINCT FROM $4
        AND source_post_id IS NOT DISTINCT FROM $5
      LIMIT 1
    `,
    [recipientUserId, actorUserId, type, postId, sourcePostId]
  )

  if (existing.rows.length > 0) {
    counts.notificationsFound += 1
    return
  }

  await client.query(
    `
      INSERT INTO notifications (recipient_user_id, actor_user_id, type, post_id, source_post_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [recipientUserId, actorUserId, type, postId, sourcePostId]
  )
  counts.notificationsCreated += 1
}

const processDiscovery = async (client, post, actorUser, counts, postIdForNotification = null) => {
  const discovery = await savePostDiscovery(client, post.id, post.content)
  counts.discoveryProcessed += 1

  for (const mentionedUser of discovery.mentionedUsers) {
    if (!mentionedUser.id) continue

    await ensureNotification(client, {
      recipientUserId: mentionedUser.id,
      actorUserId: actorUser.id,
      type: "mention",
      postId: postIdForNotification,
      sourcePostId: post.id
    }, counts)
  }
}

const ensureFollow = async (client, followerKey, followingKey, counts) => {
  const follower = userByKey.get(followerKey)
  const following = userByKey.get(followingKey)

  const result = await client.query(
    `
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING follower_id
    `,
    [follower.id, following.id]
  )

  if (result.rows.length > 0) {
    counts.followsCreated += 1
  } else {
    counts.followsFound += 1
  }

  await ensureNotification(client, {
    recipientUserId: following.id,
    actorUserId: follower.id,
    type: "follow"
  }, counts)
}

const ensureRepost = async (client, userKey, postKey, counts) => {
  const user = userByKey.get(userKey)
  const post = postByKey.get(postKey)

  const result = await client.query(
    `
      INSERT INTO reposts (user_id, post_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING user_id
    `,
    [user.id, post.id]
  )

  if (result.rows.length > 0) {
    counts.repostsCreated += 1
  } else {
    counts.repostsFound += 1
  }

  await ensureNotification(client, {
    recipientUserId: post.author_id,
    actorUserId: user.id,
    type: "repost",
    postId: post.id
  }, counts)
}

const run = async () => {
  const client = await pool.connect()
  const counts = emptyCounts()

  try {
    await client.query("BEGIN")

    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10)

    for (const demoUser of demoUsers) {
      await ensureDemoUser(client, demoUser, passwordHash, counts)
    }

    for (const [follower, following] of follows) {
      await ensureFollow(client, follower, following, counts)
    }

    for (const postSeed of topLevelPosts) {
      const post = await ensurePost(client, postSeed, counts, {
        created: "postsCreated",
        found: "postsFound"
      })
      postByKey.set(postSeed.key, post)
      await processDiscovery(client, post, userByKey.get(postSeed.author), counts)
    }

    for (const replySeed of replies) {
      const parent = postByKey.get(replySeed.parent)
      const reply = await ensurePost(client, {
        author: replySeed.author,
        content: replySeed.content,
        parentPostId: parent.id
      }, counts, {
        created: "repliesCreated",
        found: "repliesFound"
      })
      postByKey.set(replySeed.key, reply)

      await ensureNotification(client, {
        recipientUserId: parent.author_id,
        actorUserId: userByKey.get(replySeed.author).id,
        type: "reply",
        postId: parent.id,
        sourcePostId: reply.id
      }, counts)
      await processDiscovery(client, reply, userByKey.get(replySeed.author), counts, parent.id)
    }

    for (const quoteSeed of quotes) {
      const quoted = postByKey.get(quoteSeed.quoted)
      const quote = await ensurePost(client, {
        author: quoteSeed.author,
        content: quoteSeed.content,
        quotePostId: quoted.id
      }, counts, {
        created: "quotesCreated",
        found: "quotesFound"
      })
      postByKey.set(quoteSeed.key, quote)

      await ensureNotification(client, {
        recipientUserId: quoted.author_id,
        actorUserId: userByKey.get(quoteSeed.author).id,
        type: "quote",
        postId: quoted.id,
        sourcePostId: quote.id
      }, counts)
      await processDiscovery(client, quote, userByKey.get(quoteSeed.author), counts, quoted.id)
    }

    for (const [userKey, postKey] of reposts) {
      await ensureRepost(client, userKey, postKey, counts)
    }

    await client.query("COMMIT")

    console.log("Demo community seed complete")
    console.log(JSON.stringify(counts, null, 2))
    console.log("Demo accounts are simulated display accounts with unusable random passwords.")
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

void run()

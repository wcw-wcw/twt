const pool = require("../db")
const { extractMentions, savePostDiscovery } = require("../lib/discovery")
const {
  createMentionNotifications,
  createNotification
} = require("../lib/notifications")
const { getDemoProfileInterests } = require("./demo-profiles")

const MAX_POST_LENGTH = 280
const DEFAULT_LIMIT = 10
const DEFAULT_INTERVAL_MS = 30000
const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b"
const VALID_TYPES = new Set(["post", "reply", "quote", "repost"])

const FINANCIAL_RISK_PATTERN = /\b(buy|sell|trade|short|long|invest|investment|gamble|bet|wager|crypto|token|coin|forex|options?|calls?|puts?|pump|moon|guaranteed returns?|financial advice)\b/i
const IMPERSONATION_PATTERN = /\b(official account|official support|verified account|customer support|on behalf of|representing|i work for|we at (apple|google|microsoft|meta|twitter|x|openai|tesla|amazon|netflix)|i am (elon musk|sam altman|tim cook|mark zuckerberg))\b/i

const parseArgs = (argv) => {
  const options = {
    dryRun: false,
    limit: DEFAULT_LIMIT,
    model: DEFAULT_MODEL,
    baseUrl: DEFAULT_BASE_URL,
    loop: false,
    intervalMs: DEFAULT_INTERVAL_MS
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === "--dry-run") {
      options.dryRun = true
    } else if (arg === "--loop") {
      options.loop = true
    } else if (arg === "--limit") {
      if (!next) throw new Error("--limit requires a value")
      options.limit = Number(next)
      index += 1
    } else if (arg === "--model") {
      if (!next) throw new Error("--model requires a value")
      options.model = next
      index += 1
    } else if (arg === "--base-url") {
      if (!next) throw new Error("--base-url requires a value")
      options.baseUrl = next
      index += 1
    } else if (arg === "--interval-ms") {
      if (!next) throw new Error("--interval-ms requires a value")
      options.intervalMs = Number(next)
      index += 1
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50) {
    throw new Error("--limit must be an integer from 1 to 50")
  }

  if (!Number.isInteger(options.intervalMs) || options.intervalMs < 1000) {
    throw new Error("--interval-ms must be an integer of at least 1000")
  }

  if (!options.model) {
    throw new Error("--model or OLLAMA_MODEL is required")
  }

  options.baseUrl = options.baseUrl.replace(/\/+$/, "")
  return options
}

const normalizeContent = (content) => (
  String(content || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9#@]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
)

const similarity = (left, right) => {
  const leftTerms = new Set(normalizeContent(left).split(" ").filter(Boolean))
  const rightTerms = new Set(normalizeContent(right).split(" ").filter(Boolean))
  if (leftTerms.size === 0 || rightTerms.size === 0) return 0

  let intersection = 0
  for (const term of leftTerms) {
    if (rightTerms.has(term)) intersection += 1
  }

  return intersection / Math.max(leftTerms.size, rightTerms.size)
}

const compactUserProfiles = (users) => users.map((user) => ({
  username: user.username,
  demoLabel: user.demo_label || "Simulated demo account",
  displayName: user.display_name || null,
  bio: user.bio || null,
  interests: getDemoProfileInterests(user.username)
}))

const buildPrompt = ({ users, recentPosts, limit }) => `
You generate local-only sample content for a portfolio demo community.
Return only valid JSON with this exact shape: {"items":[...]}.
Generate up to ${limit} items.

Allowed item types:
- {"type":"post","authorUsername":"demo_username","content":"text"}
- {"type":"reply","authorUsername":"demo_username","targetPostHint":"recent_demo_post","content":"text"}
- {"type":"quote","authorUsername":"demo_username","targetPostHint":"recent_demo_post","content":"text"}
- {"type":"repost","authorUsername":"demo_username","targetPostHint":"recent_demo_post"}

Rules:
- Use only these demo usernames as authors or mentions.
- Do not mention any username not listed here.
- Do not choose database IDs.
- Keep post, reply, and quote content under ${MAX_POST_LENGTH} characters.
- Keep content clearly fictional, local, and demo/sample oriented.
- Do not impersonate real people, brands, companies, support accounts, or official accounts.
- Do not ask readers to buy, sell, trade, gamble, invest, or take financial risks.
- Do not connect to or claim activity on Twitter, X, or external social platforms.
- Reposts have no content.
- Prefer varied hashtags that fit this app demo, like #frontend, #backend, #demo, #uidesign, #cloud, #anime, #learning, #community.

Demo users:
${JSON.stringify(compactUserProfiles(users), null, 2)}

Recent demo posts available as possible targets, for context only:
${JSON.stringify(recentPosts.map((post) => ({
  authorUsername: post.author_username,
  content: post.content,
  kind: post.parent_post_id ? "reply" : post.quote_post_id ? "quote" : "post"
})), null, 2)}
`

const callOllama = async ({ baseUrl, model, prompt }) => {
  let response

  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json"
      })
    })
  } catch (error) {
    throw new Error(`Could not reach Ollama at ${baseUrl}. Start Ollama locally, then try again. (${error.message})`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Ollama returned HTTP ${response.status}. ${text || `Check that model '${model}' is available locally.`}`)
  }

  const payload = await response.json()
  return payload.response
}

const parseModelJson = (rawText) => {
  const trimmed = String(rawText || "").trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(withoutFence)
  } catch (error) {
    throw new Error(`Ollama did not return valid JSON: ${error.message}`)
  }
}

const loadDemoUsers = async () => {
  const result = await pool.query(
    `
      SELECT id, username, avatar_url, is_demo, demo_label
      FROM users
      WHERE is_demo = TRUE
      ORDER BY username ASC
    `
  )

  return result.rows
}

const loadRecentDemoPosts = async (limit = 40) => {
  const result = await pool.query(
    `
      SELECT
        p.id,
        p.content,
        p.author_id,
        p.parent_post_id,
        p.quote_post_id,
        p.created_at,
        u.username AS author_username
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE u.is_demo = TRUE
      ORDER BY p.created_at DESC
      LIMIT $1
    `,
    [limit]
  )

  return result.rows
}

const loadRecentDemoContent = async () => {
  const result = await pool.query(
    `
      SELECT p.content
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE u.is_demo = TRUE
      ORDER BY p.created_at DESC
      LIMIT 200
    `
  )

  return result.rows.map((row) => row.content)
}

const chooseTargetPost = (recentPosts, authorId, offset) => {
  const candidates = recentPosts.filter((post) => post.author_id !== authorId)
  const usable = candidates.length > 0 ? candidates : recentPosts
  if (usable.length === 0) return null
  return usable[offset % usable.length]
}

const validateItems = ({ parsed, users, recentPosts, existingContents }) => {
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error("Generated JSON must include an items array")
  }

  const usersByUsername = new Map(users.map((user) => [user.username.toLowerCase(), user]))
  const demoUsernameSet = new Set(users.map((user) => user.username.toLowerCase()))
  const accepted = []
  const rejected = []
  const seenContent = new Set(existingContents.map(normalizeContent))

  parsed.items.forEach((rawItem, index) => {
    const reasons = []
    const type = rawItem?.type
    const authorUsername = String(rawItem?.authorUsername || "").trim()
    const author = usersByUsername.get(authorUsername.toLowerCase())
    const content = typeof rawItem?.content === "string" ? rawItem.content.trim() : ""

    if (!VALID_TYPES.has(type)) {
      reasons.push("type must be one of post, reply, quote, repost")
    }

    if (!author) {
      reasons.push("authorUsername must belong to an is_demo user")
    }

    if (type !== "repost") {
      if (!content) {
        reasons.push("content is required")
      } else if (content.length > MAX_POST_LENGTH) {
        reasons.push(`content exceeds ${MAX_POST_LENGTH} characters`)
      }

      if (content && FINANCIAL_RISK_PATTERN.test(content)) {
        reasons.push("content contains risky financial or gambling language")
      }

      if (content && IMPERSONATION_PATTERN.test(content)) {
        reasons.push("content appears to impersonate a real person, brand, or official account")
      }

      for (const mention of extractMentions(content)) {
        if (!demoUsernameSet.has(mention.toLowerCase())) {
          reasons.push(`mention @${mention} is not an is_demo user`)
        }
      }

      const normalized = normalizeContent(content)
      if (normalized && seenContent.has(normalized)) {
        reasons.push("content duplicates an existing generated or seeded post")
      }

      if (content && existingContents.some((existing) => similarity(content, existing) >= 0.86)) {
        reasons.push("content is too similar to existing demo content")
      }

      if (accepted.some((item) => item.content && similarity(content, item.content) >= 0.86)) {
        reasons.push("content is too similar to another generated item in this batch")
      }
    } else if (rawItem?.content) {
      reasons.push("reposts must not include content")
    }

    if ((type === "reply" || type === "quote" || type === "repost") && recentPosts.length === 0) {
      reasons.push(`${type} requires an existing demo-authored target post`)
    }

    if (reasons.length > 0) {
      rejected.push({ index, item: rawItem, reasons })
      return
    }

    const targetPost = type === "reply" || type === "quote" || type === "repost"
      ? chooseTargetPost(recentPosts, author.id, accepted.length + index)
      : null

    accepted.push({
      type,
      author,
      authorUsername: author.username,
      content,
      targetPost,
      targetPostHint: rawItem.targetPostHint || null
    })

    if (content) {
      seenContent.add(normalizeContent(content))
    }
  })

  return { accepted, rejected }
}

const createDemoMentionNotifications = async (client, {
  mentionedUsers,
  demoUserIds,
  actorUserId,
  postId = null,
  sourcePostId
}) => {
  const safeMentionedUsers = mentionedUsers.filter((user) => demoUserIds.has(user.id))

  if (safeMentionedUsers.length !== mentionedUsers.length) {
    throw new Error("Refusing to notify a non-demo mentioned user")
  }

  await createMentionNotifications(client, {
    mentionedUsers: safeMentionedUsers,
    actorUserId,
    postId,
    sourcePostId
  })
}

const insertPostItem = async (client, item, demoUserIds) => {
  const result = await client.query(
    `
      INSERT INTO posts (content, author_id, parent_post_id, quote_post_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, author_id, parent_post_id, quote_post_id
    `,
    [
      item.content,
      item.author.id,
      item.type === "reply" ? item.targetPost.id : null,
      item.type === "quote" ? item.targetPost.id : null
    ]
  )

  const post = result.rows[0]
  const discovery = await savePostDiscovery(client, post.id, post.content)

  if (item.type === "reply") {
    if (!demoUserIds.has(item.targetPost.author_id)) {
      throw new Error("Refusing to notify a non-demo reply target")
    }

    await createNotification(client, {
      recipientUserId: item.targetPost.author_id,
      actorUserId: item.author.id,
      type: "reply",
      postId: item.targetPost.id,
      sourcePostId: post.id
    })
  }

  if (item.type === "quote") {
    if (!demoUserIds.has(item.targetPost.author_id)) {
      throw new Error("Refusing to notify a non-demo quote target")
    }

    await createNotification(client, {
      recipientUserId: item.targetPost.author_id,
      actorUserId: item.author.id,
      type: "quote",
      postId: item.targetPost.id,
      sourcePostId: post.id
    })
  }

  await createDemoMentionNotifications(client, {
    mentionedUsers: discovery.mentionedUsers,
    demoUserIds,
    actorUserId: item.author.id,
    postId: item.targetPost?.id || null,
    sourcePostId: post.id
  })

  return post
}

const insertRepostItem = async (client, item, demoUserIds) => {
  if (!demoUserIds.has(item.targetPost.author_id)) {
    throw new Error("Refusing to repost a non-demo target")
  }

  const result = await client.query(
    `
      INSERT INTO reposts (user_id, post_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, post_id) DO NOTHING
      RETURNING user_id
    `,
    [item.author.id, item.targetPost.id]
  )

  if (result.rows.length > 0) {
    await createNotification(client, {
      recipientUserId: item.targetPost.author_id,
      actorUserId: item.author.id,
      type: "repost",
      postId: item.targetPost.id
    })
  }

  return result.rows.length > 0
}

const insertAcceptedItems = async ({ accepted, users }) => {
  const demoUserIds = new Set(users.map((user) => user.id))
  const inserted = []
  const skipped = []

  for (const item of accepted) {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      if (item.type === "repost") {
        const created = await insertRepostItem(client, item, demoUserIds)
        if (created) {
          inserted.push({ type: item.type, authorUsername: item.authorUsername, targetPostId: item.targetPost.id })
        } else {
          skipped.push({ type: item.type, authorUsername: item.authorUsername, reason: "repost already exists" })
        }
      } else {
        const post = await insertPostItem(client, item, demoUserIds)
        inserted.push({ type: item.type, authorUsername: item.authorUsername, postId: post.id })
      }

      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {})
      skipped.push({ type: item.type, authorUsername: item.authorUsername, reason: error.message })
    } finally {
      client.release()
    }
  }

  return { inserted, skipped }
}

const runBatch = async (options) => {
  const users = await loadDemoUsers()

  if (users.length === 0) {
    throw new Error("No is_demo users found. Run npm run seed:demo --prefix backend first.")
  }

  const recentPosts = await loadRecentDemoPosts()
  const existingContents = await loadRecentDemoContent()
  const prompt = buildPrompt({ users, recentPosts, limit: options.limit })
  const rawResponse = await callOllama({
    baseUrl: options.baseUrl,
    model: options.model,
    prompt
  })
  const parsed = parseModelJson(rawResponse)
  const { accepted, rejected } = validateItems({
    parsed,
    users,
    recentPosts,
    existingContents
  })

  const limitedAccepted = accepted.slice(0, options.limit)
  const summary = {
    dryRun: options.dryRun,
    model: options.model,
    baseUrl: options.baseUrl,
    generated: Array.isArray(parsed.items) ? parsed.items.length : 0,
    accepted: limitedAccepted.length,
    rejected: rejected.length
  }

  if (options.dryRun) {
    console.log("Dry run: validated generated demo content without inserting rows.")
    console.log(JSON.stringify({
      summary,
      accepted: limitedAccepted.map((item) => ({
        type: item.type,
        authorUsername: item.authorUsername,
        targetAuthorUsername: item.targetPost?.author_username || null,
        content: item.content || null
      })),
      rejected
    }, null, 2))
    return summary
  }

  const writeResult = await insertAcceptedItems({
    accepted: limitedAccepted,
    users
  })

  console.log("Generated demo content batch complete.")
  console.log(JSON.stringify({
    summary,
    inserted: writeResult.inserted,
    skipped: writeResult.skipped,
    rejected
  }, null, 2))

  return {
    ...summary,
    inserted: writeResult.inserted.length,
    skipped: writeResult.skipped.length
  }
}

const createStopController = () => {
  let shouldStop = false
  let wakeSleep = null

  const requestStop = () => {
    shouldStop = true
    if (wakeSleep) wakeSleep()
  }

  const sleep = (ms) => new Promise((resolve) => {
    if (shouldStop) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      wakeSleep = null
      resolve()
    }, ms)

    wakeSleep = () => {
      clearTimeout(timeout)
      wakeSleep = null
      resolve()
    }
  })

  return {
    get shouldStop() {
      return shouldStop
    },
    requestStop,
    sleep
  }
}

const run = async () => {
  const options = parseArgs(process.argv.slice(2))
  const stopController = createStopController()

  const stop = () => {
    stopController.requestStop()
    console.log("Stopping demo generator after the current batch.")
  }

  process.once("SIGINT", stop)
  process.once("SIGTERM", stop)

  try {
    if (!options.loop) {
      await runBatch(options)
      return
    }

    console.log(`Starting Ollama demo generator loop every ${options.intervalMs}ms. Press Ctrl+C to stop.`)

    while (!stopController.shouldStop) {
      await runBatch(options)
      if (!stopController.shouldStop) {
        await stopController.sleep(options.intervalMs)
      }
    }
  } finally {
    await pool.end()
  }
}

void run().catch(async (error) => {
  console.error(error.message)
  await pool.end().catch(() => {})
  process.exitCode = 1
})

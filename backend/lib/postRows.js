const emptyArray = (value) => Array.isArray(value) ? value : []

const mapPostRow = (row) => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  parentPostId: row.parent_post_id,
  quotePostId: row.quote_post_id,
  mentionedUsers: emptyArray(row.mentioned_users),
  hashtags: emptyArray(row.hashtags),
  replyCount: Number(row.reply_count || 0),
  repostCount: Number(row.repost_count || 0),
  hasReposted: Boolean(row.has_reposted),
  repostedAt: row.reposted_at || null,
  repostedBy: row.reposted_by_id ? {
    id: row.reposted_by_id,
    username: row.reposted_by_username,
    avatarUrl: row.reposted_by_avatar_url,
    isDemo: Boolean(row.reposted_by_is_demo),
    demoLabel: row.reposted_by_demo_label
  } : null,
  quotedPost: row.quoted_post_id ? {
    id: row.quoted_post_id,
    content: row.quoted_content,
    createdAt: row.quoted_created_at,
    mentionedUsers: emptyArray(row.quoted_mentioned_users),
    hashtags: emptyArray(row.quoted_hashtags),
    author: {
      id: row.quoted_author_id,
      username: row.quoted_username,
      avatarUrl: row.quoted_avatar_url,
      isDemo: Boolean(row.quoted_is_demo),
      demoLabel: row.quoted_demo_label
    }
  } : null,
  author: {
    id: row.author_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    isDemo: Boolean(row.is_demo),
    demoLabel: row.demo_label
  }
})

const metadataSelect = (postAlias, mentionAlias, hashtagAlias) => `
  (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', mentioned_user.id,
          'username', mentioned_user.username,
          'avatarUrl', mentioned_user.avatar_url,
          'isDemo', mentioned_user.is_demo,
          'demoLabel', mentioned_user.demo_label
        )
        ORDER BY LOWER(mentioned_user.username)
      ),
      '[]'::json
    )
    FROM post_mentions pm
    JOIN users mentioned_user ON mentioned_user.id = pm.mentioned_user_id
    WHERE pm.post_id = ${postAlias}.id
  ) AS ${mentionAlias},
  (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', h.id,
          'tag', h.tag
        )
        ORDER BY h.tag
      ),
      '[]'::json
    )
    FROM post_hashtags ph
    JOIN hashtags h ON h.id = ph.hashtag_id
    WHERE ph.post_id = ${postAlias}.id
  ) AS ${hashtagAlias}
`

// Controllers reuse this SQL fragment so timelines, profiles, search, threads,
// and hashtag pages return the same post shape. Only fixed alias/parameter
// strings are passed in; user input remains parameterized by each caller.
const basePostSelect = (currentUserParam = null) => `
  p.id,
  p.content,
  p.parent_post_id,
  p.quote_post_id,
  p.created_at,
  ${metadataSelect("p", "mentioned_users", "hashtags")},
  COUNT(replies.id) AS reply_count,
  (
    SELECT COUNT(*)
    FROM reposts repost_count
    WHERE repost_count.post_id = p.id
  ) AS repost_count,
  ${currentUserParam ? `
    EXISTS (
      SELECT 1
      FROM reposts current_repost
      WHERE current_repost.post_id = p.id
        AND current_repost.user_id = ${currentUserParam}
    )
  ` : "false"} AS has_reposted,
  u.id AS author_id,
  u.username,
  u.avatar_url,
  u.is_demo,
  u.demo_label,
  quoted.id AS quoted_post_id,
  quoted.content AS quoted_content,
  quoted.created_at AS quoted_created_at,
  ${metadataSelect("quoted", "quoted_mentioned_users", "quoted_hashtags")},
  quoted_user.id AS quoted_author_id,
  quoted_user.username AS quoted_username,
  quoted_user.avatar_url AS quoted_avatar_url,
  quoted_user.is_demo AS quoted_is_demo,
  quoted_user.demo_label AS quoted_demo_label
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

module.exports = {
  basePostGroupBy,
  basePostJoins,
  basePostSelect,
  mapPostRow
}

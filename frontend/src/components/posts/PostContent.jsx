import { Link } from "react-router-dom"

const TOKEN_PATTERN = /[@#][A-Za-z0-9_]{1,50}/g

const normalizeMention = (value) => value.toLowerCase()
const normalizeHashtag = (value) => value.toLowerCase()

function PostContent({ content = "", mentionedUsers = [], hashtags = [], className = "postContent" }) {
  const mentionByUsername = new Map(
    mentionedUsers.map((user) => [normalizeMention(user.username), user])
  )
  const hashtagByTag = new Map(
    hashtags.map((hashtag) => [normalizeHashtag(hashtag.tag), hashtag])
  )

  const parts = []
  let lastIndex = 0

  for (const match of content.matchAll(TOKEN_PATTERN)) {
    const token = match[0]
    const index = match.index

    if (index > lastIndex) {
      parts.push(content.slice(lastIndex, index))
    }

    if (token.startsWith("@")) {
      const username = token.slice(1)
      const user = mentionByUsername.get(normalizeMention(username))

      if (user) {
        parts.push(
          <Link key={`${index}-${token}`} to={`/profile/${user.id}`} className="inlineTokenLink">
            {token}
          </Link>
        )
      } else {
        parts.push(token)
      }
    } else {
      const tag = token.slice(1)
      const hashtag = hashtagByTag.get(normalizeHashtag(tag))

      if (hashtag) {
        parts.push(
          <Link key={`${index}-${token}`} to={`/hashtag/${hashtag.tag}`} className="inlineTokenLink">
            {token}
          </Link>
        )
      } else {
        parts.push(token)
      }
    }

    lastIndex = index + token.length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return <p className={className}>{parts}</p>
}

export default PostContent

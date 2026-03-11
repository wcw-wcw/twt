import Avatar from "../common/Avatar"
import { Link } from "react-router-dom"

function Post({ post, onDelete, user }) {
  const date = new Date(post.createdAt)
  const relative = getRelativeTime(date)

  const canDelete = user && user.id === post.author?.id

  return (
    <article className="post">
      <div className="postAvatarWrap">
        <Avatar
          src={post.author?.avatar}
          name={post.author?.username}
          alt={`${post.author?.username || "Unknown"} avatar`}
          size={48}
        />
      </div>

      <div className="postBody">
        <div className="postHeader">
          <div className="postIdentity">
            <Link to={`/profile/${post.author?.id}`} className="postAuthorLink">
              @{post.author?.username || "unknown"}
            </Link>

            <span className="postDot">·</span>
            <span className="postRelativeTime">{relative}</span>
          </div>
        </div>

        <p className="postContent">{post.content}</p>

        <div className="postFooter">
          <span className="postDate">{date.toLocaleString()}</span>

          {canDelete && (
            <button
              className="deleteButton"
              onClick={() => onDelete(post.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function getRelativeTime(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s`
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export default Post
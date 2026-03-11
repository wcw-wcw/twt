function Post({ post, onDelete }) {

  const date = new Date(post.createdAt)

  const relative = getRelativeTime(date)

  return (
    <div className="post">

      <div className="postHeader">

        <strong>@{post.author?.username || "unknown"}</strong>
        
        <span>{relative}</span>

      </div>

      <p>{post.content}</p>

      <div className="postFooter">

        <span className="postDate">
          {date.toLocaleString()}
        </span>

        <button
          className="deleteButton"
          onClick={() => onDelete(post.id)}
        >
          Delete
        </button>

      </div>

    </div>
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
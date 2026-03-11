import { Link } from "react-router-dom"
import { useState } from "react"

function Post({ post, currentUser, onDelete }) {
  const [deleteError, setDeleteError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const date = new Date(post.createdAt)
  const relative = getRelativeTime(date)

  const canDelete = currentUser && post.author?.id === currentUser.id

  const handleDelete = async () => {
    try {
      setDeleting(true)
      setDeleteError("")
      await onDelete(post.id)
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="post">
      <div className="postHeader">
        <strong>
          <Link to={`/profile/${post.author?.id}`}>
            @{post.author?.username || "unknown"}
          </Link>
        </strong>

        <span>{relative}</span>
      </div>

      <p>{post.content}</p>

      <div className="postFooter">
        <span className="postDate">
          {date.toLocaleString()}
        </span>

        {canDelete && (
          <button
            className="deleteButton"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {deleteError && <p className="formError">{deleteError}</p>}
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
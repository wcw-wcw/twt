import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import Post from "../components/posts/Post"
import PostComposer from "../components/posts/PostComposer"
import Timeline from "../components/posts/Timeline"
import { API_BASE_URL } from "../lib/api"

function PostThread({ user, onDeletePost, onReplyCreated, onQuoteCreated }) {
  const { id } = useParams()

  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadThread = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/thread`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to load thread")
      }

      setPost(data.post)
      setReplies(data.replies)
    } catch (error) {
      setError(error.message)
      setPost(null)
      setReplies([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadThread()
  }, [loadThread])

  const handleReplyCreated = (reply) => {
    setReplies((prev) => [...prev, reply])
    setPost((prev) => prev ? { ...prev, replyCount: (prev.replyCount || 0) + 1 } : prev)
    onReplyCreated?.(id)
  }

  const handleDelete = async (postId) => {
    await onDeletePost(postId)

    if (postId === post?.id) {
      setPost(null)
      setReplies([])
      setError("Post deleted.")
      return
    }

    setReplies((prev) => prev.filter((reply) => reply.id !== postId))
  }

  if (loading) {
    return <p className="empty">Loading thread...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  if (!post) {
    return <p className="empty">Post not found.</p>
  }

  return (
    <div className="threadPage">
      <Link to="/" className="backLink">Back to home</Link>

      <Post
        post={post}
        onDelete={handleDelete}
        onQuoteCreated={onQuoteCreated}
        user={user}
      />

      <section className="replyComposerSection">
        {user ? (
          <PostComposer
            user={user}
            onPost={handleReplyCreated}
            endpoint={`/api/posts/${post.id}/replies`}
            submitLabel="Reply"
            placeholder="Post your reply"
            loggedOutPlaceholder="Log in to reply"
            emptyMessage="Reply cannot be empty."
          />
        ) : (
          <p className="empty">
            <Link to="/login">Log in</Link> to reply.
          </p>
        )}
      </section>

      <h2 className="threadHeading">Replies</h2>

      {replies.length === 0 ? (
        <p className="empty">No replies yet.</p>
      ) : (
        <Timeline
          posts={replies}
          onDelete={handleDelete}
          onQuoteCreated={onQuoteCreated}
          user={user}
        />
      )}
    </div>
  )
}

export default PostThread

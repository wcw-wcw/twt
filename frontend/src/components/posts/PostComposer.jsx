import { useState } from "react"
import { Link } from "react-router-dom"
import { API_BASE_URL, getAuthHeaders } from "../../lib/api"

function PostComposer({ onPost, currentUser }) {
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentUser) {
      setError("Please log in to create a post.")
      return
    }

    if (!text.trim()) {
      setError("Post cannot be empty.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          content: text
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post")
      }

      onPost(data)
      setText("")
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        placeholder={currentUser ? "What's happening?" : "Log in to post"}
        value={text}
        maxLength={280}
        disabled={!currentUser || submitting}
        onChange={(e) => setText(e.target.value)}
      />

      {error && <p className="formError">{error}</p>}

      {!currentUser && (
        <p className="empty">
          <Link to="/login">Log in</Link> to join the conversation.
        </p>
      )}

      <div className="composerFooter">
        <span>{text.length}/280</span>
        <button type="submit" disabled={!currentUser || submitting}>
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  )
}

export default PostComposer
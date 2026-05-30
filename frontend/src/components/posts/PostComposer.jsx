import { useState } from "react"
import { Link } from "react-router-dom"
import { API_BASE_URL, getAuthHeaders } from "../../lib/api"

function PostComposer({ onPost, user }) {
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setError("Please log in to create a post.")
      return
    }

    if (!text.trim()) {
      setError("Post cannot be empty.")
      return
    }

    try {
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ content: text })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create post")
      }

      onPost(data)
      setText("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        placeholder={user ? "What's happening?" : "Log in to post"}
        value={text}
        maxLength={280}
        onChange={(e) => setText(e.target.value)}
      />

      {!user && (
        <p className="empty">
          <Link to="/login">Log in</Link> to join the conversation.
        </p>
      )}

      {error && <p className="formError">{error}</p>}

      <div className="composerFooter">
        <span>{text.length}/280</span>
        <button type="submit">Post</button>
      </div>
    </form>
  )
}

export default PostComposer

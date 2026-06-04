import { useState } from "react"
import { Link } from "react-router-dom"
import { API_BASE_URL, getAuthHeaders } from "../../lib/api"

function PostComposer({
  onPost,
  user,
  endpoint = "/api/posts",
  submitLabel = "Post",
  placeholder = "What's happening?",
  loggedOutPlaceholder = "Log in to post",
  emptyMessage = "Post cannot be empty.",
  loginPrompt = "to join the conversation."
}) {
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setError("Please log in first.")
      return
    }

    if (!text.trim()) {
      setError(emptyMessage)
      return
    }

    try {
      setError("")

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ content: text })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed to create ${submitLabel.toLowerCase()}`)
      }

      onPost?.(data)
      setText("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        placeholder={user ? placeholder : loggedOutPlaceholder}
        value={text}
        maxLength={280}
        onChange={(e) => setText(e.target.value)}
      />

      {!user && (
        <p className="empty">
          <Link to="/login">Log in</Link> {loginPrompt}
        </p>
      )}

      {error && <p className="formError">{error}</p>}

      <div className="composerFooter">
        <span>{text.length}/280</span>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}

export default PostComposer

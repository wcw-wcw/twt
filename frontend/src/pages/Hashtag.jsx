import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import Timeline from "../components/posts/Timeline"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Hashtag({ user, onDeletePost, onQuoteCreated, onRepostChange }) {
  const { tag } = useParams()
  const normalizedTag = (tag || "").toLowerCase()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/hashtags/${encodeURIComponent(normalizedTag)}/posts`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to load hashtag")
      }

      setPosts(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [normalizedTag])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts, user?.id])

  return (
    <div className="hashtagPage">
      <header className="pageHeader">
        <h2>#{normalizedTag}</h2>
        <p>{posts.length} {posts.length === 1 ? "post" : "posts"}</p>
      </header>

      {loading && <p className="empty">Loading hashtag...</p>}
      {error && <p className="formError">{error}</p>}

      {!loading && !error && posts.length === 0 ? (
        <p className="empty">No posts found for this hashtag.</p>
      ) : (
        <Timeline
          posts={posts}
          user={user}
          onDelete={onDeletePost}
          onQuoteCreated={onQuoteCreated}
          onRepostChange={onRepostChange}
        />
      )}
    </div>
  )
}

export default Hashtag

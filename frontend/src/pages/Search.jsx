import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import Timeline from "../components/posts/Timeline"
import Avatar from "../components/common/Avatar"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Search({ user, onDeletePost, onQuoteCreated, onRepostChange }) {
  const [searchParams] = useSearchParams()
  const query = useMemo(() => (searchParams.get("q") || "").trim(), [searchParams])

  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!query) {
      setResults({ users: [], posts: [], hashtags: [] })
      return
    }

    const loadResults = async () => {
      try {
        setLoading(true)
        setError("")

        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
          headers: getAuthHeaders()
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to search")
        }

        setResults(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    void loadResults()
  }, [query])

  const hasResults = results.users.length > 0 || results.posts.length > 0 || results.hashtags.length > 0

  return (
    <div className="discoveryPage">
      <header className="pageHeader">
        <h2>Search</h2>
        {query && <p>Results for &quot;{query}&quot;</p>}
      </header>

      {!query && <p className="empty">Search for users, posts, or hashtags.</p>}
      {loading && <p className="empty">Searching...</p>}
      {error && <p className="formError">{error}</p>}

      {!loading && query && !error && !hasResults && (
        <p className="empty">No results found.</p>
      )}

      {!loading && results.users.length > 0 && (
        <section className="resultSection">
          <h3>Users</h3>
          <div className="profileUserList">
            {results.users.map((resultUser) => (
              <Link key={resultUser.id} to={`/profile/${resultUser.id}`} className="profileUserRow">
                <Avatar
                  src={resultUser.avatarUrl}
                  name={resultUser.username}
                  alt={`${resultUser.username} avatar`}
                  size={42}
                />
                <span className="profileUserHandle">@{resultUser.username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && results.hashtags.length > 0 && (
        <section className="resultSection">
          <h3>Hashtags</h3>
          <div className="hashtagResultList">
            {results.hashtags.map((hashtag) => (
              <Link key={hashtag.id} to={`/hashtag/${hashtag.tag}`} className="hashtagResult">
                <span>#{hashtag.tag}</span>
                <small>{hashtag.postCount} {hashtag.postCount === 1 ? "post" : "posts"}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && results.posts.length > 0 && (
        <section className="resultSection">
          <h3>Posts</h3>
          <Timeline
            posts={results.posts}
            user={user}
            onDelete={onDeletePost}
            onQuoteCreated={onQuoteCreated}
            onRepostChange={onRepostChange}
          />
        </section>
      )}
    </div>
  )
}

export default Search

import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import Avatar from "../common/Avatar"

function TopBar({ user, logout }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  const handleSearch = (event) => {
    event.preventDefault()
    const trimmedQuery = query.trim()

    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search")
  }

  return (
    <header className="topBar">
      <div className="topBarInner">
        <Link to="/" className="brandLink">
          <h1 className="brandTitle">twt</h1>
        </Link>

        <form className="topBarSearch" onSubmit={handleSearch}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search"
            maxLength={80}
          />
        </form>

        <div className="topBarAuth">
          {user ? (
            <>
              <Link to={`/profile/${user.id}`} className="topBarProfile">
                <Avatar
                  src={user.avatarUrl}
                  name={user.username}
                  alt={`${user.username} avatar`}
                  size={36}
                />
                <span className="topBarUsername">@{user.username}</span>
              </Link>

              <button className="topBarButton primaryButton" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="topBarButton ghostButton">
                Login
              </Link>

              <Link to="/register" className="topBarButton primaryButton">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar

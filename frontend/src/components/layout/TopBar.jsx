import { Link } from "react-router-dom"
import Avatar from "../common/Avatar"

function TopBar({ user, logout }) {
  return (
    <header className="topBar">
      <div className="topBarInner">
        <Link to="/" className="brandLink">
          <h1 className="brandTitle">twt</h1>
        </Link>

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

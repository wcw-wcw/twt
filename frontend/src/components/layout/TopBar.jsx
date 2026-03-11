import { Link } from "react-router-dom"

function TopBar({ user, logout, authLoading }) {
  return (
    <div className="topBar">
      <Link to="/">
        <h2>Twitter Clone</h2>
      </Link>

      <div className="topBarAuth">
        {authLoading ? (
          <span>Loading...</span>
        ) : user ? (
          <>
            <Link to={`/profile/${user.id}`}>@{user.username}</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default TopBar
import { Link } from "react-router-dom"

function TopBar({ user, logout }) {

  return (

    <div className="topBar">

      <Link to="/">
        <h2>Twitter Clone</h2>
      </Link>

      <div className="topBarAuth">

        {user ? (

          <>
            <Link to={`/profile/${user.id}`}>
              Profile
            </Link>

            <button onClick={logout}>
              Logout
            </button>
          </>

        ) : (

          <>
            <Link to="/login">
              Login
            </Link>

            <Link to="/register">
              Sign Up
            </Link>
          </>

        )}

      </div>

    </div>

  )

}

export default TopBar
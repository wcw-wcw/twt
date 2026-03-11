import { NavLink } from "react-router-dom"

function LeftSidebar({ user }) {
  const navClass = ({ isActive }) =>
    isActive ? "navItem active" : "navItem"

  return (
    <aside className="sidebar">
      <h2>MiniTwitter</h2>

      <nav>
        <NavLink to="/" className={navClass}>
          Home
        </NavLink>

        {user && (
          <NavLink to={`/profile/${user.id}`} className={navClass}>
            Profile
          </NavLink>
        )}

        <div className="navItem">Explore</div>
        <div className="navItem">Settings</div>
      </nav>
    </aside>
  )
}

export default LeftSidebar
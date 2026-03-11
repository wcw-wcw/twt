import { NavLink } from "react-router-dom"

function LeftSidebar({ user }) {
  const navClass = ({ isActive }) =>
    isActive ? "navItem active" : "navItem"

  return (
    <aside className="sidebar">
      <h2 className="sidebarTitle">MiniTwitter</h2>

      <nav className="sidebarNav">
        <NavLink to="/" className={navClass}>
          Home
        </NavLink>

        {user && (
          <NavLink to={`/profile/${user.id}`} className={navClass}>
            Profile
          </NavLink>
        )}

        <div className="navItem navItemStatic">Explore</div>
        <div className="navItem navItemStatic">Settings</div>
      </nav>
    </aside>
  )
}

export default LeftSidebar
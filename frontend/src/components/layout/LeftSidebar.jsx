import { NavLink } from "react-router-dom"

function LeftSidebar({ user, unreadNotificationCount = 0 }) {
  const navClass = ({ isActive }) =>
    isActive ? "navItem active" : "navItem"

  return (
    <aside className="sidebar">
      <nav className="sidebarNav">
        <NavLink to="/" className={navClass}>
          Home
        </NavLink>

        {user && (
          <>
            <NavLink to="/notifications" className={navClass}>
              <span>Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="navBadge">{unreadNotificationCount}</span>
              )}
            </NavLink>

            <NavLink to={`/profile/${user.id}`} className={navClass}>
              Profile
            </NavLink>
          </>
        )}

        <NavLink to="/search" className={navClass}>
          Explore
        </NavLink>
        <div className="navItem navItemStatic">Settings</div>
      </nav>
    </aside>
  )
}

export default LeftSidebar

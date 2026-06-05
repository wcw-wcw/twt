import LeftSidebar from "./LeftSidebar"
import RightPanel from "./RightPanel"
import TopBar from "./TopBar"

function Layout({ children, user, logout, unreadNotificationCount }) {
  return (
    <div className="layoutWrapper">
      <TopBar
        user={user}
        logout={logout}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div className="layout">
        <LeftSidebar user={user} unreadNotificationCount={unreadNotificationCount} />

        <main className="mainContent">
          {children}
        </main>

        <RightPanel />
      </div>
    </div>
  )
}

export default Layout

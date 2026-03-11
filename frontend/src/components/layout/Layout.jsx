import LeftSidebar from "./LeftSidebar"
import RightPanel from "./RightPanel"
import TopBar from "./TopBar"

function Layout({ children, user, logout, authLoading }) {
  return (
    <div className="layoutWrapper">
      <TopBar user={user} logout={logout} authLoading={authLoading} />

      <div className="layout">
        <LeftSidebar user={user} />
        <main className="mainContent">{children}</main>
        <RightPanel />
      </div>
    </div>
  )
}

export default Layout
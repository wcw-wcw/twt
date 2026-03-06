import LeftSidebar from "./LeftSidebar"
import RightPanel from "./RightPanel"
import TopBar from "./TopBar"

function Layout({ children }) {

  return (
    <div className="layoutWrapper">

      <TopBar />

      <div className="layout">

        <LeftSidebar />

        <main className="mainContent">
          {children}
        </main>

        <RightPanel />

      </div>

    </div>
  )
}

export default Layout
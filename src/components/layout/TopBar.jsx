import { useNavigate } from "react-router-dom"

function TopBar() {

  const navigate = useNavigate()

  return (
    <div className="topBar">

      <button
        className="homeButton"
        onClick={() => navigate("/")}
      >
        Home
      </button>

    </div>
  )
}

export default TopBar
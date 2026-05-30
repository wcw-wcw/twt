import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_BASE_URL } from "../lib/api"

function Login({ login }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      login(data.user, data.token)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="authPanel">
      <h2>Login</h2>

      {error && <p className="formError">{error}</p>}

      <form className="authForm" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      <p className="authSwitch">
        Need an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  )
}

export default Login

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_BASE_URL } from "../lib/api"

function Register({ setUser }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      localStorage.setItem("token", data.token)
      setUser(data.user)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="authPanel">
      <h2>Create account</h2>

      {error && <p className="formError">{error}</p>}

      <form className="authForm" onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

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

        <button type="submit">Register</button>
      </form>

      <p className="authSwitch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

export default Register

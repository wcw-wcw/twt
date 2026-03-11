import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Register({ setCurrentUser }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    setError("")
  }, [username, email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          username,
          email,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      localStorage.setItem("token", data.token)
      setCurrentUser(data.user)
      navigate("/")
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Create account</h2>

      {error && <p className="formError">{error}</p>}

      <form onSubmit={handleSubmit}>
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
          minLength={6}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Register"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

export default Register
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"

function Login({ login, currentUser }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) {
      navigate("/")
    }
  }, [currentUser, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      await login(email, password)
      navigate("/")
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Login</h2>

      {error && <p className="formError">{error}</p>}

      <form onSubmit={handleSubmit}>
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

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Need an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  )
}

export default Login
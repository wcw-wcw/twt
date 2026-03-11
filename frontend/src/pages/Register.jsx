import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

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

      const res = await fetch("http://localhost:3001/api/auth/register", {
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
          required
        />

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

export default Register
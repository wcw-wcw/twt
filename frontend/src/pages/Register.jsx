import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Register() {

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {

    e.preventDefault()

    await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    })

    navigate("/login")

  }

  return (

    <div>

      <h2>Register</h2>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          placeholder="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit">
          Register
        </button>

      </form>

    </div>

  )
}

export default Register
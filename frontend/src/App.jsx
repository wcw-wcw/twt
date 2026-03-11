import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"

function App() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)

  const fetchPosts = async () => {
    const res = await fetch("http://localhost:3001/api/posts")
    const data = await res.json()
    setPosts(data)
  }

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const res = await fetch("http://localhost:3001/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        localStorage.removeItem("token")
        setUser(null)
        return
      }

      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error("Failed to fetch current user:", error)
      setUser(null)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchCurrentUser()
  }, [])

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const deletePost = async (id) => {
    const token = localStorage.getItem("token")

    const res = await fetch(`http://localhost:3001/api/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to delete post")
    }

    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const login = (loggedInUser, token) => {
    localStorage.setItem("token", token)
    setUser(loggedInUser)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <Layout user={user} logout={logout}>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              posts={posts}
              addPost={addPost}
              deletePost={deletePost}
              user={user}
            />
          }
        />

        <Route path="/profile/:id" element={<Profile user={user} />} />

        <Route
          path="/login"
          element={<Login login={login} />}
        />

        <Route
          path="/register"
          element={<Register setUser={setUser} />}
        />
      </Routes>
    </Layout>
  )
}

export default App
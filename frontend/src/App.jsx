import { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import { API_BASE_URL, getAuthHeaders } from "./lib/api"

function App() {
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState("")

  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const fetchPosts = async () => {
    setPostsLoading(true)
    setPostsError("")

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to load posts")
      }

      setPosts(data)
    } catch (error) {
      setPostsError(error.message)
    } finally {
      setPostsLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      setAuthLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders()
      })

      if (!res.ok) {
        localStorage.removeItem("token")
        setCurrentUser(null)
        return
      }

      const data = await res.json()
      setCurrentUser(data)
    } catch (error) {
      setCurrentUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchCurrentUser()
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Login failed")
    }

    localStorage.setItem("token", data.token)
    setCurrentUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setCurrentUser(null)
  }

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const deletePost = async (postId) => {
    const previousPosts = posts

    setPosts((prev) => prev.filter((post) => post.id !== postId))

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete post")
      }
    } catch (error) {
      setPosts(previousPosts)
      throw error
    }
  }

  return (
    <Layout
      user={currentUser}
      logout={logout}
      authLoading={authLoading}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Home
              posts={posts}
              postsLoading={postsLoading}
              postsError={postsError}
              currentUser={currentUser}
              addPost={addPost}
              deletePost={deletePost}
              refreshPosts={fetchPosts}
            />
          }
        />

        <Route
          path="/login"
          element={<Login login={login} currentUser={currentUser} />}
        />

        <Route
          path="/register"
          element={<Register setCurrentUser={setCurrentUser} />}
        />

        <Route
          path="/profile/:id"
          element={
            <Profile
              currentUser={currentUser}
              onDeletePost={deletePost}
            />
          }
        />
      </Routes>
    </Layout>
  )
}

export default App
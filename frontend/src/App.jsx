import { useState, useEffect, useCallback } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import PostThread from "./pages/PostThread"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { API_BASE_URL, getAuthHeaders } from "./lib/api"

function App() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)

  const fetchPosts = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/posts`)
    const data = await res.json()
    setPosts(data)
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders()
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
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPosts()
    void fetchCurrentUser()
  }, [fetchPosts, fetchCurrentUser])

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const incrementReplyCount = (postId) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId
        ? { ...post, replyCount: (post.replyCount || 0) + 1 }
        : post
    )))
  }

  const deletePost = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
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

        <Route
          path="/post/:id"
          element={
            <PostThread
              user={user}
              onDeletePost={deletePost}
              onReplyCreated={incrementReplyCount}
              onQuoteCreated={addPost}
            />
          }
        />

        <Route
          path="/profile/:id"
          element={
            <Profile
              user={user}
              onDeletePost={deletePost}
              onQuoteCreated={addPost}
            />
          }
        />

        <Route path="/login" element={<Login login={login} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
      </Routes>
    </Layout>
  )
}

export default App

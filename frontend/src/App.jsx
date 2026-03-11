import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"

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

    const res = await fetch("http://localhost:3001/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) return

    const data = await res.json()

    setUser(data)

  }

  useEffect(() => {

    fetchPosts()
    fetchCurrentUser()

  }, [])

  const addPost = (newPost) => {

    setPosts(prev => [newPost, ...prev])

  }

  const deletePost = async (id) => {

    const token = localStorage.getItem("token")

    await fetch(`http://localhost:3001/api/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    setPosts(prev => prev.filter(p => p.id !== id))

  }

  return (

    <Layout user={user}>

      <Routes>

        <Route
          path="/"
          element={
            <Home
              posts={posts}
              addPost={addPost}
              deletePost={deletePost}
            />
          }
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

      </Routes>

    </Layout>

  )
}

export default App
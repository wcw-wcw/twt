import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"

function App() {

  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem("posts")
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts))
  }, [posts])

  const addPost = (content) => {

    const newPost = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: "1",
        username: "demoUser",
        avatar: "/default-avatar.png"
      }
    }

    setPosts(prev => [newPost, ...prev])
  }

  return (
    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Home posts={posts} addPost={addPost} />}
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
import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"

function App() {

  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {

    const res = await fetch("http://localhost:3001/api/posts")

    const data = await res.json()

    setPosts(data)
  }

  const deletePost = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const addPost = (post) => {
    setPosts(prev => [post, ...prev])
  }

  return (
    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Home posts={posts} addPost={addPost} deletePost={deletePost} />}
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
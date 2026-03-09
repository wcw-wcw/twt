import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"

import Layout from "./components/layout/Layout"
import Home from "./pages/Home"
import Profile from "./pages/Profile"

function App() {

  const [posts, setPosts] = useState([])

  // Load posts from backend
  useEffect(() => {
    fetch("http://localhost:3001/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error(err))
  }, [])

  const deletePost = async (id) => {

    try {
      await fetch(`http://localhost:3001/api/posts/${id}`, {
        method: "DELETE"
      })

      setPosts(prev => prev.filter(p => p.id !== id))

    } catch (err) {
      console.error(err)
    }

  }

  const addPost = async (content) => {

    try {

      const res = await fetch("http://localhost:3001/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content,
          author_id: "6b4e196d-5bfc-4816-92a1-d8711e3f438f"
        })
      })

      const newPost = await res.json()

      setPosts(prev => [newPost, ...prev])

    } catch (err) {
      console.error(err)
    }

  }

  return (
    <Layout>

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
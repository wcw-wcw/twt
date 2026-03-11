import { useState } from "react"

function PostComposer({ onPost }) {

  const [text, setText] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!text.trim()) return

    const token = localStorage.getItem("token")

    if (!token) {
      alert("Please log in to post")
      return
    }

    const res = await fetch("http://localhost:3001/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        content: text
      })
    })

    if (!res.ok) {
      alert("Post failed. Try logging in again.")
      return
    }

    const newPost = await res.json()

    onPost(newPost)

    setText("")
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>

      <textarea
        placeholder="What's happening?"
        value={text}
        maxLength={280}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="composerFooter">

        <span>{text.length}/280</span>

        <button type="submit">Post</button>

      </div>

    </form>
  )
}

export default PostComposer
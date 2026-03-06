import { useState } from "react"

function PostComposer({ onPost }) {

  const [text, setText] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!text.trim()) return

    onPost(text)

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
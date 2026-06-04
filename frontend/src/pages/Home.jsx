import PostComposer from "../components/posts/PostComposer"
import Timeline from "../components/posts/Timeline"

function Home({ posts, addPost, deletePost, onRepostChange, user }) {
  return (
    <div>
      <PostComposer onPost={addPost} user={user} />

      <Timeline
        posts={posts}
        onDelete={deletePost}
        onQuoteCreated={addPost}
        onRepostChange={onRepostChange}
        user={user}
      />
    </div>
  )
}

export default Home

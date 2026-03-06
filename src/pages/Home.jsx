import PostComposer from "../components/posts/PostComposer"
import Timeline from "../components/posts/Timeline"

function Home({ posts, addPost }) {

  return (
    <div>

      <PostComposer onPost={addPost} />

      <Timeline posts={posts} />

    </div>
  )
}

export default Home
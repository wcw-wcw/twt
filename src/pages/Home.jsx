import PostComposer from "../components/posts/PostComposer"
import Timeline from "../components/posts/Timeline"

function Home({ posts, addPost, deletePost}) {

  return (
    <div>

      <PostComposer onPost={addPost} />

      <Timeline posts={posts} onDelete={deletePost}/>

    </div>
  )
}

export default Home
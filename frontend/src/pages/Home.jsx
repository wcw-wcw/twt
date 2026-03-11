import PostComposer from "../components/posts/PostComposer"
import Timeline from "../components/posts/Timeline"

function Home({
  posts,
  postsLoading,
  postsError,
  currentUser,
  addPost,
  deletePost
}) {
  return (
    <div>
      <PostComposer
        onPost={addPost}
        currentUser={currentUser}
      />

      <Timeline
        posts={posts}
        currentUser={currentUser}
        onDelete={deletePost}
        loading={postsLoading}
        error={postsError}
      />
    </div>
  )
}

export default Home
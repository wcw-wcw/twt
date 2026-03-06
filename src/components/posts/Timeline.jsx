import Post from "./Post"

function Timeline({ posts }) {

  return (
    <div className="timeline">

      {posts.length === 0 && (
        <p className="empty">No posts yet</p>
      )}

      {posts.map(post => (
        <Post key={post.id} post={post} />
      ))}

    </div>
  )
}

export default Timeline
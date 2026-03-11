import Post from "./Post"

function Timeline({ posts, currentUser, onDelete, loading, error }) {
  if (loading) {
    return (
      <div className="timeline">
        <p className="empty">Loading posts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="timeline">
        <p className="formError">{error}</p>
      </div>
    )
  }

  return (
    <div className="timeline">
      {posts.length === 0 && (
        <p className="empty">No posts yet</p>
      )}

      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          currentUser={currentUser}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default Timeline
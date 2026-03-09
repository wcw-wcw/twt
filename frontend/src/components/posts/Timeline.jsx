import Post from "./Post"

function Timeline({ posts, onDelete }) {

  return (
    <div className="timeline">

      {posts.length === 0 && (
        <p className="empty">No posts yet</p>
      )}

      {posts.map(post => (
        <Post
          key={post.id}
          post={post}
          onDelete={onDelete}
        />
      ))}

    </div>
  )
}

export default Timeline
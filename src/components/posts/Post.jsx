function Post({ post }) {

  const date = new Date(post.createdAt)

  return (
    <div className="post">

      <div className="postHeader">

        <strong>@{post.author.username}</strong>

        <span>
          {date.toLocaleString()}
        </span>

      </div>

      <p>{post.content}</p>

    </div>
  )
}

export default Post
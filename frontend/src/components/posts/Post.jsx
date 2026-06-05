import { useState } from "react"
import Avatar from "../common/Avatar"
import { Link } from "react-router-dom"
import PostComposer from "./PostComposer"
import PostContent from "./PostContent"
import { repostPost, unrepostPost } from "../../lib/api"

function Post({ post, onDelete, onQuoteCreated, onRepostChange, user }) {
  const [showQuoteComposer, setShowQuoteComposer] = useState(false)
  const [quoteMessage, setQuoteMessage] = useState("")
  const [repostMessage, setRepostMessage] = useState("")
  const [repostLoading, setRepostLoading] = useState(false)

  const date = new Date(post.createdAt)
  const relative = getRelativeTime(date)

  const canDelete = Boolean(onDelete && user && user.id === post.author?.id)

  const handleQuoteClick = () => {
    setQuoteMessage("")

    if (!user) {
      setShowQuoteComposer(false)
      setQuoteMessage("Please log in to quote this post.")
      return
    }

    setShowQuoteComposer((current) => !current)
  }

  const handleQuoteCreated = (quotePost) => {
    onQuoteCreated?.(quotePost)
    setShowQuoteComposer(false)
    setQuoteMessage("Quote posted.")
  }

  const handleRepostClick = async () => {
    setRepostMessage("")

    if (!user) {
      setRepostMessage("Please log in to repost this post.")
      return
    }

    try {
      setRepostLoading(true)

      const nextState = post.hasReposted
        ? await unrepostPost(post.id)
        : await repostPost(post.id)

      onRepostChange?.(post.id, {
        repostCount: nextState.repostCount,
        hasReposted: nextState.hasReposted
      })
    } catch (error) {
      setRepostMessage(error.message || "Failed to update repost.")
    } finally {
      setRepostLoading(false)
    }
  }

  return (
    <article className="post">
      <div className="postAvatarWrap">
        <Avatar
          src={post.author?.avatarUrl}
          name={post.author?.username}
          alt={`${post.author?.username || "Unknown"} avatar`}
          size={48}
        />
      </div>

      <div className="postBody">
        {post.repostedBy && (
          <Link to={`/profile/${post.repostedBy.id}`} className="repostedByLine">
            Reposted by @{post.repostedBy.username}
          </Link>
        )}

        <div className="postHeader">
          <div className="postIdentity">
            <Link to={`/profile/${post.author?.id}`} className="postAuthorLink">
              @{post.author?.username || "unknown"}
            </Link>

            <span className="postDot">·</span>
            <span className="postRelativeTime">{relative}</span>
          </div>
        </div>

        <PostContent
          content={post.content}
          mentionedUsers={post.mentionedUsers}
          hashtags={post.hashtags}
        />

        {post.quotedPost ? (
          <div className="quotedPostCard">
            <Link to={`/profile/${post.quotedPost.author?.id}`} className="quotedPostAuthor">
              @{post.quotedPost.author?.username || "unknown"}
            </Link>
            <PostContent
              content={post.quotedPost.content}
              mentionedUsers={post.quotedPost.mentionedUsers}
              hashtags={post.quotedPost.hashtags}
              className="quotedPostContent"
            />
            <Link to={`/post/${post.quotedPost.id}`} className="quotedPostThreadLink">
              View thread
            </Link>
          </div>
        ) : post.quotePostId ? (
          <div className="quotedPostCard quotedPostUnavailable">
            Original post unavailable.
          </div>
        ) : null}

        <div className="postFooter">
          <span className="postDate">{date.toLocaleString()}</span>

          <Link to={`/post/${post.id}`} className="postActionLink threadLink">
            {post.replyCount || 0} {(post.replyCount || 0) === 1 ? "reply" : "replies"}
          </Link>

          <button
            type="button"
            className={post.hasReposted ? "postActionButton repostButton repostButtonActive" : "postActionButton repostButton"}
            onClick={handleRepostClick}
            disabled={repostLoading}
          >
            {repostLoading ? "Updating..." : `${post.repostCount || 0} ${(post.repostCount || 0) === 1 ? "repost" : "reposts"}`}
          </button>

          <button type="button" className="postActionButton quoteButton" onClick={handleQuoteClick}>
            Quote
          </button>

          {canDelete && (
            <button type="button" className="deleteButton" onClick={() => onDelete(post.id)}>
              Delete
            </button>
          )}
        </div>

        {quoteMessage && (
          <p className={user ? "formSuccess" : "formError"}>
            {quoteMessage}
            {user && quoteMessage === "Quote posted." && (
              <>
                {" "}
                <Link to={`/profile/${user.id}`}>View on your profile</Link>
              </>
            )}
          </p>
        )}

        {repostMessage && <p className="formError">{repostMessage}</p>}

        {showQuoteComposer && (
          <div className="quoteComposer">
            <PostComposer
              user={user}
              onPost={handleQuoteCreated}
              endpoint={`/api/posts/${post.id}/quote`}
              submitLabel="Quote"
              placeholder="Add your comment"
              loggedOutPlaceholder="Log in to quote"
              emptyMessage="Quote cannot be empty."
              loginPrompt="to quote this post."
            />
          </div>
        )}
      </div>
    </article>
  )
}

function getRelativeTime(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s`
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export default Post

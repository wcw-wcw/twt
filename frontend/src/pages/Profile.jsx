import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Timeline from "../components/posts/Timeline"
import Avatar from "../components/common/Avatar"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Profile({ user, onDeletePost, onQuoteCreated, onRepostChange }) {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState("")

  const isOwnProfile = user?.id === id
  const currentUserId = user?.id

  const isFollowing = useMemo(() => {
    if (!user) return false
    return followers.some((follower) => follower.id === user.id)
  }, [followers, user])

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [profileRes, postsRes, followersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${id}`),
        fetch(`${API_BASE_URL}/api/users/${id}/posts`, {
          headers: getAuthHeaders()
        }),
        fetch(`${API_BASE_URL}/api/users/${id}/followers`)
      ])

      const [profileData, postsData, followersData] = await Promise.all([
        profileRes.json(),
        postsRes.json(),
        followersRes.json()
      ])

      if (!profileRes.ok) throw new Error(profileData.error || "Failed to load profile")
      if (!postsRes.ok) throw new Error(postsData.error || "Failed to load posts")
      if (!followersRes.ok) throw new Error(followersData.error || "Failed to load followers")

      setProfile(profileData)
      setPosts(postsData)
      setFollowers(followersData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadProfileData()
  }, [loadProfileData, currentUserId])

  const handleToggleFollow = async () => {
    if (!user) {
      setFollowError("Please log in to follow users.")
      return
    }

    try {
      setFollowLoading(true)
      setFollowError("")

      const method = isFollowing ? "DELETE" : "POST"

      const res = await fetch(`${API_BASE_URL}/api/users/${id}/follow`, {
        method,
        headers: getAuthHeaders()
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow state")
      }

      await loadProfileData()
    } catch (error) {
      setFollowError(error.message)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleRepostChange = (postId, repostState) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId
        ? {
            ...post,
            repostCount: repostState.repostCount,
            hasReposted: repostState.hasReposted
          }
        : post
    )).filter((post) => (
      repostState.hasReposted ||
      post.id !== postId ||
      post.repostedBy?.id !== user?.id
    )))
    onRepostChange?.(postId, repostState)
  }

  if (loading) {
    return <p className="empty">Loading profile...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  return (
    <div className="profilePage">
      <header className="profileHeader">
        <div className="profileHeaderMain">
          <div className="profileIdentityBlock">
            <Avatar
              src={profile.avatarUrl}
              name={profile.username}
              alt={`${profile.username} avatar`}
              size={72}
            />

            <div className="profileIdentityText">
              <h1>@{profile.username}</h1>

              <nav className="profileStats" aria-label="Profile stats">
                <span>{profile.counts.posts} {profile.counts.posts === 1 ? "post" : "posts"}</span>
                <Link to={`/profile/${id}/followers`}>
                  {profile.counts.followers} {profile.counts.followers === 1 ? "follower" : "followers"}
                </Link>
                <Link to={`/profile/${id}/following`}>
                  {profile.counts.following} following
                </Link>
              </nav>
            </div>
          </div>

          <p className="profileJoinedDate">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>

        {!isOwnProfile && user && (
          <div className="profileFollowAction">
            <button onClick={handleToggleFollow} disabled={followLoading}>
              {followLoading ? "Updating..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        )}

        {!user && (
          <p className="empty">
            <Link to="/login">Log in</Link> to follow @{profile.username}.
          </p>
        )}

        {followError && <p className="formError">{followError}</p>}
      </header>

      <h2>Posts</h2>

      <Timeline
        posts={posts}
        user={user}
        onQuoteCreated={onQuoteCreated}
        onRepostChange={handleRepostChange}
        onDelete={async (postId) => {
          await onDeletePost(postId)
          setPosts((prev) => prev.filter((post) => post.id !== postId))
        }}
      />
    </div>
  )
}

export default Profile

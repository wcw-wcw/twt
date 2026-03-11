import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Timeline from "../components/posts/Timeline"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Profile({ currentUser, onDeletePost }) {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState("")

  const isOwnProfile = currentUser?.id === id

  const isFollowing = useMemo(() => {
    if (!currentUser) return false
    return followers.some((user) => user.id === currentUser.id)
  }, [followers, currentUser])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError("")

      const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${id}`),
        fetch(`${API_BASE_URL}/api/users/${id}/posts`),
        fetch(`${API_BASE_URL}/api/users/${id}/followers`),
        fetch(`${API_BASE_URL}/api/users/${id}/following`)
      ])

      const [profileData, postsData, followersData, followingData] = await Promise.all([
        profileRes.json(),
        postsRes.json(),
        followersRes.json(),
        followingRes.json()
      ])

      if (!profileRes.ok) throw new Error(profileData.error || "Failed to load profile")
      if (!postsRes.ok) throw new Error(postsData.error || "Failed to load posts")
      if (!followersRes.ok) throw new Error(followersData.error || "Failed to load followers")
      if (!followingRes.ok) throw new Error(followingData.error || "Failed to load following")

      setProfile(profileData)
      setPosts(postsData)
      setFollowers(followersData)
      setFollowing(followingData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [id])

  const handleToggleFollow = async () => {
    if (!currentUser) {
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

  if (loading) {
    return <p className="empty">Loading profile...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  return (
    <div>
      <header className="post">
        <h1>@{profile.username}</h1>

        <p className="postDate">
          Joined {new Date(profile.createdAt).toLocaleDateString()}
        </p>

        <div className="postFooter">
          <span>{profile.counts.posts} posts</span>
          <span>{profile.counts.followers} followers</span>
          <span>{profile.counts.following} following</span>
        </div>

        {!isOwnProfile && currentUser && (
          <button onClick={handleToggleFollow} disabled={followLoading}>
            {followLoading ? "Updating..." : isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}

        {!currentUser && (
          <p className="empty">
            <Link to="/login">Log in</Link> to follow @{profile.username}.
          </p>
        )}

        {followError && <p className="formError">{followError}</p>}
      </header>

      <section className="post">
        <h3>Followers</h3>
        {followers.length === 0 ? (
          <p className="empty">No followers yet.</p>
        ) : (
          followers.map((user) => (
            <p key={user.id}>
              <Link to={`/profile/${user.id}`}>@{user.username}</Link>
            </p>
          ))
        )}
      </section>

      <section className="post">
        <h3>Following</h3>
        {following.length === 0 ? (
          <p className="empty">Not following anyone yet.</p>
        ) : (
          following.map((user) => (
            <p key={user.id}>
              <Link to={`/profile/${user.id}`}>@{user.username}</Link>
            </p>
          ))
        )}
      </section>

      <h2>Posts</h2>

      <Timeline
        posts={posts}
        currentUser={currentUser}
        onDelete={async (postId) => {
          await onDeletePost(postId)
          setPosts((prev) => prev.filter((post) => post.id !== postId))
        }}
        loading={false}
        error=""
      />
    </div>
  )
}

export default Profile
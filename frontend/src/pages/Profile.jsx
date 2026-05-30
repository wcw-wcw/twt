import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Timeline from "../components/posts/Timeline"
import Avatar from "../components/common/Avatar"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

function Profile({ user, onDeletePost }) {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState("")

  const isOwnProfile = user?.id === id

  const isFollowing = useMemo(() => {
    if (!user) return false
    return followers.some((follower) => follower.id === user.id)
  }, [followers, user])

  const loadProfileData = useCallback(async () => {
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
  }, [id])

  useEffect(() => {
    void loadProfileData()
  }, [loadProfileData])

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

  if (loading) {
    return <p className="empty">Loading profile...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  return (
    <div className="profilePage">
      <header className="post">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
          <Avatar
            src={profile.avatarUrl}
            name={profile.username}
            alt={`${profile.username} avatar`}
            size={72}
          />

          <div>
            <h1 style={{ margin: 0 }}>@{profile.username}</h1>
            <p className="postDate" style={{ marginTop: "8px" }}>
              Joined {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="postFooter" style={{ marginTop: "16px" }}>
          <span>{profile.counts.posts} posts</span>
          <span>{profile.counts.followers} followers</span>
          <span>{profile.counts.following} following</span>
        </div>

        {!isOwnProfile && user && (
          <div style={{ marginTop: "16px" }}>
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

      <section className="post">
        <div style={{ width: "100%" }}>
          <h3>Followers</h3>

          {followers.length === 0 ? (
            <p className="empty">No followers yet.</p>
          ) : (
            <div className="profileUserList">
              {followers.map((follower) => (
                <ProfileUserRow key={follower.id} person={follower} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="post">
        <div style={{ width: "100%" }}>
          <h3>Following</h3>

          {following.length === 0 ? (
            <p className="empty">Not following anyone yet.</p>
          ) : (
            <div className="profileUserList">
              {following.map((followedUser) => (
                <ProfileUserRow key={followedUser.id} person={followedUser} />
              ))}
            </div>
          )}
        </div>
      </section>

      <h2>Posts</h2>

      <Timeline
        posts={posts}
        user={user}
        onDelete={async (postId) => {
          await onDeletePost(postId)
          setPosts((prev) => prev.filter((post) => post.id !== postId))
        }}
      />
    </div>
  )
}

function ProfileUserRow({ person }) {
  return (
    <Link to={`/profile/${person.id}`} className="profileUserRow">
      <Avatar
        src={person.avatarUrl}
        name={person.username}
        alt={`${person.username} avatar`}
        size={48}
      />

      <div className="profileUserMeta">
        <span className="profileUserHandle">@{person.username}</span>
      </div>
    </Link>
  )
}

export default Profile

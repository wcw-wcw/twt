import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { API_BASE_URL } from "../lib/api"
import ProfileUserRow from "../components/profile/ProfileUserRow"
import DemoBadge from "../components/common/DemoBadge"

function ProfileConnections({ type }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [people, setPeople] = useState([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const label = type === "followers" ? "Followers" : "Following"
  const emptyLabel = type === "followers" ? "No followers found." : "No following found."

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const [profileRes, peopleRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${id}`),
        fetch(`${API_BASE_URL}/api/users/${id}/${type}`)
      ])

      const [profileData, peopleData] = await Promise.all([
        profileRes.json(),
        peopleRes.json()
      ])

      if (!profileRes.ok) throw new Error(profileData.error || "Failed to load profile")
      if (!peopleRes.ok) throw new Error(peopleData.error || `Failed to load ${type}`)

      setProfile(profileData)
      setPeople(peopleData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [id, type])

  useEffect(() => {
    void loadConnections()
  }, [loadConnections])

  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) return people

    return people.filter((person) => (
      person.username.toLowerCase().includes(normalizedQuery)
    ))
  }, [people, query])

  if (loading) {
    return <p className="empty">Loading {label.toLowerCase()}...</p>
  }

  if (error) {
    return <p className="formError">{error}</p>
  }

  return (
    <div className="connectionsPage">
      <Link to={`/profile/${id}`} className="backLink">Back to profile</Link>

      <header className="connectionsHeader">
        <div>
          <h2>{label}</h2>
          {profile && (
            <p className="profileUserIdentity">
              <span>@{profile.username}</span>
              <DemoBadge user={profile} />
            </p>
          )}
        </div>
      </header>

      <input
        className="connectionSearch"
        type="search"
        placeholder={`Search ${label.toLowerCase()}`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="profileUserList">
        {filteredPeople.length === 0 ? (
          <p className="empty">{emptyLabel}</p>
        ) : (
          filteredPeople.map((person) => (
            <ProfileUserRow key={person.id} person={person} />
          ))
        )}
      </div>
    </div>
  )
}

export default ProfileConnections

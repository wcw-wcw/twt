import { Link } from "react-router-dom"
import Avatar from "../common/Avatar"

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

export default ProfileUserRow

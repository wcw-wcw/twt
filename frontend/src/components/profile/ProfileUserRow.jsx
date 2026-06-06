import { Link } from "react-router-dom"
import Avatar from "../common/Avatar"
import DemoBadge from "../common/DemoBadge"

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
        <span className="profileUserIdentity">
          <span className="profileUserHandle">@{person.username}</span>
          <DemoBadge user={person} />
        </span>
      </div>
    </Link>
  )
}

export default ProfileUserRow

import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../lib/api"

const notificationText = {
  follow: "followed you",
  reply: "replied to your post",
  mention: "mentioned you",
  quote: "quoted your post",
  repost: "reposted your post"
}

const getNotificationPostLink = (notification) => {
  if (notification.sourcePostId) return `/post/${notification.sourcePostId}`
  if (notification.postId) return `/post/${notification.postId}`
  return null
}

function Notifications({ user, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState("")
  const [markAllLoading, setMarkAllLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")
      const data = await fetchNotifications()
      setNotifications(data)
    } catch (error) {
      setError(error.message || "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const handleMarkRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId)
      const result = await markNotificationRead(notificationId)
      setNotifications((prev) => prev.map((notification) => (
        notification.id === notificationId
          ? { ...notification, readAt: result.readAt }
          : notification
      )))
      onUnreadCountChange?.()
    } catch (error) {
      setError(error.message || "Failed to update notification")
    } finally {
      setUpdatingId("")
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkAllLoading(true)
      await markAllNotificationsRead()
      const readAt = new Date().toISOString()
      setNotifications((prev) => prev.map((notification) => ({
        ...notification,
        readAt: notification.readAt || readAt
      })))
      onUnreadCountChange?.()
    } catch (error) {
      setError(error.message || "Failed to update notifications")
    } finally {
      setMarkAllLoading(false)
    }
  }

  if (!user) {
    return (
      <section className="notificationsPage">
        <div className="pageHeader">
          <h2>Notifications</h2>
          <p><Link to="/login">Log in</Link> to view your notifications.</p>
        </div>
      </section>
    )
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  return (
    <section className="notificationsPage">
      <header className="notificationsHeader">
        <div className="pageHeader">
          <h2>Notifications</h2>
          <p>{unreadCount} unread</p>
        </div>

        <button
          type="button"
          className="secondaryButton"
          onClick={handleMarkAllRead}
          disabled={markAllLoading || unreadCount === 0}
        >
          {markAllLoading ? "Updating..." : "Mark all as read"}
        </button>
      </header>

      {loading && <p className="empty">Loading notifications...</p>}
      {error && <p className="formError">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <p className="empty">No notifications yet.</p>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notificationList">
          {notifications.map((notification) => {
            const postLink = getNotificationPostLink(notification)
            const isUnread = !notification.readAt

            return (
              <article
                className={isUnread ? "notificationItem unread" : "notificationItem"}
                key={notification.id}
              >
                <div className="notificationContent">
                  <p>
                    {notification.actor ? (
                      <Link to={`/profile/${notification.actor.id}`} className="notificationActor">
                        @{notification.actor.username}
                      </Link>
                    ) : (
                      <span className="notificationActor">Someone</span>
                    )}
                    {" "}
                    {notificationText[notification.type] || "sent you a notification"}
                  </p>

                  <div className="notificationMeta">
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    {postLink && <Link to={postLink}>View post</Link>}
                  </div>
                </div>

                {isUnread && (
                  <button
                    type="button"
                    className="secondaryButton notificationReadButton"
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={updatingId === notification.id}
                  >
                    {updatingId === notification.id ? "Updating..." : "Mark read"}
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Notifications

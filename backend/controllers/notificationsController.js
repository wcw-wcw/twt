const {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} = require("../lib/notifications")

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user.id)
    return res.json(notifications)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch notifications" })
  }
}

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await getUnreadNotificationCount(req.user.id)
    return res.json({ unreadCount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to fetch unread notifications" })
  }
}

exports.markRead = async (req, res) => {
  try {
    const notification = await markNotificationRead(req.user.id, req.params.id)

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" })
    }

    return res.json({ success: true, id: notification.id, readAt: notification.read_at })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to update notification" })
  }
}

exports.markAllRead = async (req, res) => {
  try {
    const updatedCount = await markAllNotificationsRead(req.user.id)
    return res.json({ success: true, updatedCount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to update notifications" })
  }
}

const express = require("express")
const router = express.Router()

const auth = require("../middleware/auth")
const notificationsController = require("../controllers/notificationsController")

router.get("/", auth, notificationsController.getNotifications)
router.get("/unread-count", auth, notificationsController.getUnreadCount)
router.patch("/:id/read", auth, notificationsController.markRead)
router.patch("/read-all", auth, notificationsController.markAllRead)

module.exports = router

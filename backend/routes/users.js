const express = require("express")
const router = express.Router()

const auth = require("../middleware/auth")
const {
  getUserProfile,
  getUserPosts,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require("../controllers/usersController")

router.get("/:id", getUserProfile)
router.get("/:id/posts", auth.optional, getUserPosts)
router.get("/:id/followers", getFollowers)
router.get("/:id/following", getFollowing)

router.post("/:id/follow", auth, followUser)
router.delete("/:id/follow", auth, unfollowUser)

module.exports = router

const express = require("express")
const router = express.Router()

const postsController = require("../controllers/postsController")
const auth = require("../middleware/auth")

router.get("/", auth.optional, postsController.getPosts)
router.post("/", auth, postsController.createPost)
router.get("/:id/thread", auth.optional, postsController.getThread)
router.post("/:id/replies", auth, postsController.createReply)
router.post("/:id/quote", auth, postsController.createQuote)
router.post("/:id/repost", auth, postsController.repostPost)
router.delete("/:id/repost", auth, postsController.unrepostPost)
router.delete("/:id", auth, postsController.deletePost)

module.exports = router

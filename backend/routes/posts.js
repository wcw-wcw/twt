const express = require("express")
const router = express.Router()

const postsController = require("../controllers/postsController")
const auth = require("../middleware/auth")

router.get("/", postsController.getPosts)
router.post("/", auth, postsController.createPost)
router.get("/:id/thread", postsController.getThread)
router.post("/:id/replies", auth, postsController.createReply)
router.delete("/:id", auth, postsController.deletePost)

module.exports = router

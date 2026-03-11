const express = require("express")
const router = express.Router()

const postsController = require("../controllers/postsController")
const auth = require("../middleware/auth")

router.get("/", postsController.getPosts)
router.post("/", auth, postsController.createPost)
router.delete("/:id", auth, postsController.deletePost)

module.exports = router
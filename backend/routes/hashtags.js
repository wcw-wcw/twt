const express = require("express")
const router = express.Router()

const searchController = require("../controllers/searchController")
const auth = require("../middleware/auth")

router.get("/:tag/posts", auth.optional, searchController.getHashtagPosts)

module.exports = router

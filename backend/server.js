const express = require("express")
const cors = require("cors")

const postsRoutes = require("./routes/posts")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/posts", postsRoutes)

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
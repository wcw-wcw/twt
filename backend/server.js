const express = require("express")
const cors = require("cors")
require("dotenv").config()

const postsRoutes = require("./routes/posts")
const authRoutes = require("./routes/auth")
const usersRoutes = require("./routes/users")

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}))

app.use(express.json())

app.get(["/api/health", "/health"], (req, res) => {
  res.json({ ok: true })
})

app.use("/api/auth", authRoutes)
app.use("/api/posts", postsRoutes)
app.use("/api/users", usersRoutes)

app.use("/auth", authRoutes)
app.use("/posts", postsRoutes)
app.use("/users", usersRoutes)

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

const PORT = process.env.PORT || 3001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app

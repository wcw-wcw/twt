const pool = require("../db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const JWT_SECRET = "devsecret"

exports.register = async (req, res) => {
  const { username, email, password } = req.body

  try {

    const hashed = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, username, email`,
      [username, email, hashed]
    )

    res.json(result.rows[0])

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Registration failed" })
  }
}

exports.getMe = async (req, res) => {

  try {

    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id=$1",
      [req.user.id]
    )

    res.json(user.rows[0])

  } catch (err) {

    res.status(500).json({ error: "Server error" })

  }

}

exports.login = async (req, res) => {
  const { email, password } = req.body

  try {

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Login failed" })
  }
}
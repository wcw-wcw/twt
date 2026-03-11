const pool = require("../db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const signToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )
}

exports.register = async (req, res) => {
  const { username, email, password } = req.body

  if (!username?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Username, email, and password are required" })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" })
  }

  try {
    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1 OR username = $2`,
      [email.trim().toLowerCase(), username.trim()]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email or username already in use" })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, avatar_url, created_at
      `,
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    )

    const user = result.rows[0]
    const token = signToken(user.id)

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Registration failed" })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  try {
    const result = await pool.query(
      `
        SELECT id, username, email, password_hash, avatar_url, created_at
        FROM users
        WHERE email = $1
      `,
      [email.trim().toLowerCase()]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = signToken(user.id)

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Login failed" })
  }
}

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, username, email, avatar_url, created_at
        FROM users
        WHERE id = $1
      `,
      [req.user.id]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Server error" })
  }
}
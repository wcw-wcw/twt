const { Pool } = require("pg")
require("dotenv").config()

const useSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL?.includes("sslmode=require")

// Hosted Postgres providers such as Neon commonly require SSL, while local
// development usually does not. The pool keeps both paths behind env config.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  ssl: useSsl ? { rejectUnauthorized: false } : false
})

module.exports = pool

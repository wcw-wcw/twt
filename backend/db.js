const { Pool } = require("pg")

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "twitter_clone",
  password: "postgres",
  port: 5432
})

module.exports = pool
const pool = require("../db")

const run = async () => {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    const result = await client.query(
      `
        DELETE FROM users
        WHERE is_demo = TRUE
          AND username LIKE 'demo_%'
        RETURNING id, username
      `
    )

    await client.query("COMMIT")

    console.log("Demo community cleanup complete")
    console.log(JSON.stringify({
      demoUsersDeleted: result.rowCount,
      deletedUsernames: result.rows.map((row) => row.username)
    }, null, 2))
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    console.error(error.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

void run()

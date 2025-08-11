import * as path from 'path'
import * as fs from 'fs'
import Database from 'better-sqlite3'

export function createDataBase() {
  const myPath = path.join(path.dirname(__filename), '..', '..', '..', 'data')
  fs.mkdirSync(myPath, { recursive: true })

  const dbPath = path.join(myPath, 'database.sqlite')
  const db = new Database(dbPath)

  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      tokenCabinet TEXT
    )
  `).run()
}


import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

export class DataBase {
    protected db: import('better-sqlite3').Database;

    constructor() {
        const name: string = 'database';

        const myPath = path.join(process.cwd(), 'data');
        const dbPath = path.join(myPath, `${name}.sqlite`);

        fs.mkdirSync(myPath, { recursive: true });
        this.db = new Database(dbPath);
    }

    public createTables() {
        this.createUser()
        this.createCache()
    }

    private createUser() {
        this.db
            .prepare(`
                CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL CHECK(type IN ('user', 'superuser')),
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                tokenRozklad TEXT,
                tokenCabinet TEXT
            )`,).run();

        this.db
            .prepare(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_type_name
                ON users(type, name);
            `).run();
    }

    private createCache() {
        this.db
            .prepare(`
                CREATE TABLE IF NOT EXISTS cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    "group" NUMBER NOT NULL UNIQUE,
                    data TEXT NOT NULL,
                    selectiveDays TEXT NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('common', 'super')),
                    created_at TEXT DEFAULT (datetime('now', 'localtime'))
                )
            `)
            .run();
    }

}

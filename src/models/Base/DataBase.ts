import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

export class DataBase {
    private static connection: import('better-sqlite3').Database | undefined;
    private static statements: Map<string, import('better-sqlite3').Statement> = new Map();

    protected db: import('better-sqlite3').Database;

    constructor() {
        this.db = DataBase.connect();
    }

    // Models are built per request, and each of them used to open its own sqlite
    // handle. A single process wide connection is shared instead.
    private static connect(): import('better-sqlite3').Database {
        if (DataBase.connection) return DataBase.connection;

        const name: string = 'database';

        const myPath = path.join(process.cwd(), 'data');
        const dbPath = path.join(myPath, `${name}.sqlite`);

        fs.mkdirSync(myPath, { recursive: true });

        const db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');

        DataBase.connection = db;

        return db;
    }

    // Statements are compiled once and reused, so a repeated query no longer
    // pays for parsing its sql again.
    protected prepare(sql: string): import('better-sqlite3').Statement {
        const cached = DataBase.statements.get(sql);
        if (cached) return cached;

        const statement = this.db.prepare(sql);
        DataBase.statements.set(sql, statement);

        return statement;
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

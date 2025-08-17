import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import { DBUser } from '../../classes/type/DBUser';
import { timeLog } from 'console';

export class DataBase {
    private name: string = 'database';
    private db: import('better-sqlite3').Database;

    constructor() {
        const myPath = path.join(path.dirname(__filename), '..', '..', 'data');
        const dbPath = path.join(myPath, `${this.name}.sqlite`);

        fs.mkdirSync(myPath, { recursive: true });
        this.db = new Database(dbPath);
    }

    public getUserData() { }

    public checkSuperUser() {
        const stmt =
            (this.db
                .prepare('SELECT * FROM users WHERE type = ? LIMIT 1')
                .get('superuser') as DBUser) || undefined;

        if (stmt === undefined) {
            console.log('[error] U need register superuser!');
            // process.exit(1)
        } else {
            // console.log(stmt);
        }
    }

    public create() {
        this.db
            .prepare(
                `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                name TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                tokenRozklad TEXT,
                tokenCabinet TEXT
            )
        `,
            )
            .run();
    }

    public updateData(
        name: string,
        tokenCabinet?: string | null,
        tokenRozklad?: string | null,
    ): object {
        try {
            if (tokenCabinet !== undefined) {
                const stmt = this.db.prepare(
                    'UPDATE users SET tokenCabinet = ? WHERE name = ? LIMIT 1',
                );
                stmt.run(tokenCabinet, name);
            }

            if (tokenRozklad !== undefined) {
                const stmt = this.db.prepare(
                    'UPDATE users SET tokenRozklad = ? WHERE name = ? LIMIT 1',
                );
                stmt.run(tokenRozklad, name);
            }

            return {
                message: 'Updated!',
            };
        } catch (err) {
            return {
                message: 'Error with work in database',
                error: err,
            };
        }
    }

    public new(type: string, name: string, password: string): object {
        try {
            const stmt = this.db.prepare(
                'INSERT INTO users (type, name, password) VALUES (?, ?, ?)',
            );
            const info = stmt.run(type, name, password);

            return {
                meesage: 'created!',
                data: { id: info.lastInsertRowid, type, name, password },
            };
        } catch (err) {
            return {
                message: 'Error with work in database',
                error: err,
            };
        }
    }

    public getNameOfSuperUser(): string | undefined {
        const stmt = this.db.prepare(
            'SELECT name FROM users WHERE type = ?',
        ).get('superuser') as { 'name': string };

        if (stmt) {
            return stmt.name
        }
    }

    public getDataOfName(name: string): DBUser {
        const stmt = this.db.prepare(
            'SELECT * FROM users WHERE name = ?'
        ).get(name) as DBUser;

        return stmt
    }
}

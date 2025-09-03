import * as path from 'path';
import * as fs from 'fs';

import { DataBase } from './Base/DataBase';
import { DBUser } from '../classes/type/DBUser';

export class User extends DataBase {
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

    public new(type: string, name: string, password: string): boolean {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO users (type, name, password)
                VALUES (?, ?, ?)
                ON CONFLICT(type, name) DO UPDATE SET
                    password = excluded.password;

            `,).run(type, name, password);

            return true
        } catch (err) {
            return false
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

    public getDataOfNameSuperUser(name: string): DBUser {
        const stmt = this.db.prepare(
            'SELECT * FROM users WHERE name = ? AND type = ?'
        ).get(name, 'superuser') as DBUser;

        return stmt
    }

    public getDataOfNameUser(name: string): DBUser {
        const stmt = this.db.prepare(
            'SELECT * FROM users WHERE name = ? AND type = ?'
        ).get(name, 'user') as DBUser;

        return stmt
    }
}

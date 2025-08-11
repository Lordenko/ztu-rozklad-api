import { fetchRozklad }  from "../utils/fetchRozklad";
import * as path from 'path'
import * as fs from 'fs'
import Database from 'better-sqlite3'

export async function insertData(name: string, password: string) {
    const myPath = path.join(path.dirname(__filename), '..', '..', 'data')
    fs.mkdirSync(myPath, { recursive: true })

    const dbPath = path.join(myPath, 'database.sqlite')
    const db = new Database(dbPath)

    try {
        const stmt = db.prepare('INSERT INTO users (name, password) VALUES (?, ?)');
        const info = stmt.run(name, password);
        return { id: info.lastInsertRowid, name, password };
    } catch (err) {
        console.log(
            { error: 'User with this email already exists' }, err
        );
    }
}
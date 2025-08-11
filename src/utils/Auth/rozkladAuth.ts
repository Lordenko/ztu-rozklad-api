import * as fs from 'fs'
import * as path from 'path'
import Database from 'better-sqlite3';

export function rozkladAuth() {
    fs.mkdirSync(path.join(path.dirname(__filename), '..', '..', '..', 'data'), { recursive: true })
    
    const dbPath = path.join(__dirname, 'mydb.sqlite');
    const db = new Database(dbPath);

    

}

import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

function main() {
    const tableName = process.argv[2]

    const name: string = 'database';
    const myPath = path.join(path.dirname(__filename), '..', 'src', 'data');
    const dbPath = path.join(myPath, `${name}.sqlite`);

    fs.mkdirSync(myPath, { recursive: true });

    const db: import('better-sqlite3').Database = new Database(dbPath)

    db.prepare(`DELETE FROM ${tableName}`).run()
    console.log(`Table '${tableName}' cleared!`);
}

main();
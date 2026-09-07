import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

const allowedTables: string[] = ['users', 'cache'];

function main() {
    const tableName = process.argv[2]

    // The name goes straight into the statement, so it has to come from the list.
    if (!tableName || !allowedTables.includes(tableName)) {
        console.error(`Pass one of the tables: ${allowedTables.join(', ')}`);
        process.exit(1);
    }

    const name: string = 'database';

    const myPath = path.join(process.cwd(), 'data');
    const dbPath = path.join(myPath, `${name}.sqlite`);

    if (!fs.existsSync(dbPath)) {
        console.error(`Database not found at ${dbPath}`);
        process.exit(1);
    }

    const db: import('better-sqlite3').Database = new Database(dbPath)

    db.prepare(`DELETE FROM ${tableName}`).run()
    console.log(`Table '${tableName}' cleared!`);
}

main();

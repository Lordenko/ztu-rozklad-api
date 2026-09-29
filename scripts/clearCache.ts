import * as path from 'path';
import Database from 'better-sqlite3';

function main() {
    const tableName = process.argv[2]
    if (!tableName) {
        console.error('Usage: npm run clear-table <table>');
        process.exit(1);
    }

    // той самий шлях, що й у DataBase: process.cwd()/data (у докері — /app/data)
    const name: string = 'database';
    const myPath = path.join(process.cwd(), 'data');
    const dbPath = path.join(myPath, `${name}.sqlite`);

    // fileMustExist — щоб не створити порожню базу, якщо шлях неправильний
    const db: import('better-sqlite3').Database = new Database(dbPath, { fileMustExist: true })

    db.prepare(`DELETE FROM ${tableName}`).run()
    console.log(`Table '${tableName}' cleared!`);
}

main();

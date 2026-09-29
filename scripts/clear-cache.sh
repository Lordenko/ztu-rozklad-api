#!/bin/sh
# Очищає кеш розкладу в запущеному контейнері (без перезапуску сервера).
# Використання:
#   ./scripts/clear-cache.sh                   — весь кеш
#   ./scripts/clear-cache.sh <group>           — усі записи групи
#   ./scripts/clear-cache.sh <group> <user>    — кеш групи для конкретного користувача
# Назву контейнера можна змінити: CONTAINER=parser ./scripts/clear-cache.sh
set -e

CONTAINER="${CONTAINER:-parser}"

docker exec -i "$CONTAINER" node - "$@" <<'JS'
const Database = require('better-sqlite3');

const [group, username] = process.argv.slice(2);
const db = new Database('/app/data/database.sqlite');

let result;
if (group === undefined) {
    result = db.prepare('DELETE FROM cache').run();
} else if (username === undefined) {
    result = db.prepare('DELETE FROM cache WHERE "group" = ?').run(Number(group));
} else {
    result = db.prepare('DELETE FROM cache WHERE "group" = ? AND username = ?').run(Number(group), username);
}

console.log(`Cache cleared: ${result.changes} row(s) deleted`);
JS

import * as path from 'path';
import * as fs from 'fs';

import { DataBase } from './Base/DataBase';

// Кеш ключується парою (group, username): для 'common' username = '',
// для 'super' — ім'я користувача, бо його вибіркові дисципліни персональні.
export class Cache extends DataBase {
    public insert(group: number, data: { "data": object, "selectiveDays": string[] }, status: "common" | "super", username?: string): void {
        this.db.prepare(`
        INSERT INTO cache ("group", username, data, selectiveDays, status, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT("group", username) DO UPDATE SET
            data = excluded.data,
            selectiveDays = excluded.selectiveDays,
            status = excluded.status,
            created_at = datetime('now', 'localtime')
        `).run(group, username ?? '', JSON.stringify(data.data), JSON.stringify(data.selectiveDays), status);
    }

    public getDataByGroup(group: number, username?: string) {
        const stmt = this.db.prepare(
            'SELECT data, selectiveDays, created_at FROM cache WHERE "group" = ? AND username = ?',
        ).get(group, username ?? '') as { 'data': string, 'selectiveDays': string, 'created_at': string } | undefined;

        if (!stmt || this.checkTimeExpired(stmt.created_at)) return undefined

        return { 'data': JSON.parse(stmt.data), 'selectiveDays': JSON.parse(stmt.selectiveDays) }
    }

    private checkTimeExpired(createdAt: string): boolean {
        const acceptHours: number = 1

        const createdAtDate: Date = new Date(createdAt)
        const nowTimeDate: Date = new Date()

        const diffMs = nowTimeDate.getTime() - createdAtDate.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        const time = (diffHours >= acceptHours) ? true : false

        return time
    }
}

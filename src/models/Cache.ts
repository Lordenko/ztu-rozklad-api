import * as path from 'path';
import * as fs from 'fs';

import { DataBase } from './Base/DataBase';

export class Cache extends DataBase {
    public insert(group: number, data: { "data": object, "selectiveDays": [string] }, status: "common" | "super"): void {
        this.db.prepare(`
        INSERT INTO cache ("group", data, selectiveDays, status, created_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT("group") DO UPDATE SET
            data = excluded.data,
            selectiveDays = excluded.selectiveDays,
            status = excluded.status,
            created_at = datetime('now', 'localtime')
        `).run(group, JSON.stringify(data.data), JSON.stringify(data.selectiveDays), status);
    }

    public getDataByGroup(group: number, status: "common" | "super") {
        const exists = this.checkExistByGroup(group);
        const expired = this.checkTimeExpiredByGroup(group);

        if (exists === false || expired === true) return undefined

        const groupDataStatus: string | undefined = this.getStatusByGroup(group)
        if (groupDataStatus && status === 'super' && groupDataStatus === 'common') return undefined


        const stmt = this.db.prepare(
            'SELECT data, selectiveDays  FROM cache WHERE "group" = ?',
        ).get(group) as { 'data': string, 'selectiveDays': string };

        return stmt ? { 'data': JSON.parse(stmt.data), 'selectiveDays': JSON.parse(stmt.selectiveDays) } : undefined
    }

    private getStatusByGroup(group: number): string | undefined {
        const stmt = this.db.prepare(
            'SELECT status FROM cache WHERE "group" = ?',
        ).get(group) as { 'status': string };

        return stmt ? stmt.status : undefined
    }

    private checkExistByGroup(group: number): boolean {
        const stmt = this.db.prepare(
            'SELECT "group" FROM cache WHERE "group" = ?',
        ).get(group);

        return stmt ? true : false
    }

    private getCreatedAtByGroup(group: number) {
        if (this.checkExistByGroup(group)) {
            const stmt = this.db.prepare(
                'SELECT created_at FROM cache WHERE "group" = ?',
            ).get(group) as { 'created_at': string };

            return stmt ? stmt.created_at : undefined
        }
    }

    private checkTimeExpiredByGroup(group: number): boolean {
        const acceptHours: number = 1

        const createdAt = this.getCreatedAtByGroup(group)
        if (!createdAt) return false

        const createdAtDate: Date = new Date(createdAt)
        const nowTimeDate: Date = new Date()

        const diffMs = nowTimeDate.getTime() - createdAtDate.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        const time = (diffHours <= acceptHours) ? true : false

        return time
    }
}

import { DataBase } from './Base/DataBase';
import { ScheduleResult } from '../classes/type/ScheduleData';

type CacheRow = {
    data: string;
    selectiveDays: string;
    status: string;
};

export class Cache extends DataBase {
    private readonly acceptHours: number = 1;

    public insert(group: number, data: ScheduleResult, status: "common" | "super"): void {
        this.prepare(`
        INSERT INTO cache ("group", data, selectiveDays, status, created_at)
        VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT("group") DO UPDATE SET
            data = excluded.data,
            selectiveDays = excluded.selectiveDays,
            status = excluded.status,
            created_at = datetime('now', 'localtime')
        `).run(group, JSON.stringify(data.data), JSON.stringify(data.selectiveDays), status);
    }

    // Existence and expiry used to cost a separate select each; the row is now
    // fetched once, with the ttl applied by sqlite itself.
    public getDataByGroup(group: number, status: "common" | "super"): ScheduleResult | undefined {
        const row = this.prepare(`
            SELECT data, selectiveDays, status
            FROM cache
            WHERE "group" = ?
              AND created_at > datetime('now', 'localtime', ?)
        `).get(group, `-${this.acceptHours} hours`) as CacheRow | undefined;

        if (!row) return undefined;

        // A cabinet backed request cannot be served from a plain rozklad entry.
        if (status === 'super' && row.status === 'common') return undefined;

        return {
            'data': JSON.parse(row.data),
            'selectiveDays': JSON.parse(row.selectiveDays)
        }
    }
}

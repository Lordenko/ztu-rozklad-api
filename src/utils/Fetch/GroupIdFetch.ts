import * as cheerio from 'cheerio';

export class GroupIdFetch {
    async fetch(html: string, groupName: string): Promise<number | undefined> {
        const $ = cheerio.load(html);

        const wanted = groupName.trim();
        if (!wanted) return undefined;

        let exact: number | undefined;
        let normalized: number | undefined;

        // The list marks every group as `a[data-id][data-group]`; the href is kept
        // as a fallback for anchors that carry no data attributes.
        $('a[data-id], a[href*="group?id="]').each((_, group) => {
            const $group = $(group);

            const id = this.getId($group);
            if (id === undefined) return;

            const name = $group.attr('data-group') ?? $group.text();

            if (name.trim() === wanted) {
                exact = id;
                return false;
            }

            if (normalized === undefined && this.normalize(name) === this.normalize(wanted)) {
                normalized = id;
            }
        });

        return exact ?? normalized;
    }

    private getId($group: cheerio.Cheerio<any>): number | undefined {
        const dataId = $group.attr('data-id');
        if (dataId && /^\d+$/.test(dataId.trim())) return parseInt(dataId, 10);

        const href = $group.attr('href')?.match(/[?&]id=(\d+)/);
        if (href) return parseInt(href[1], 10);

        return undefined;
    }

    private normalize(value: string): string {
        return value.replace(/\s+/g, ' ').trim().toLowerCase();
    }
}

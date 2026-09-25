import * as cheerio from 'cheerio';

export class GroupIdFetch {
    private toCanonical(str: string): string {
        const map: Record<string, string> = {
            'a': 'а', 'b': 'б', 'c': 'с', 'd': 'д', 'e': 'е', 'f': 'ф',
            'g': 'г', 'h': 'х', 'i': 'і', 'k': 'к', 'l': 'л', 'm': 'м',
            'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т',
            'u': 'у', 'v': 'в', 'x': 'х', 'y': 'у', 'z': 'з', 'w': 'в',
            'j': 'й', 'q': 'к'
        };
        let s = str.trim().toLowerCase();
        s = s.replace(/tz/g, 'тз').replace(/ts/g, 'ц').replace(/ch/g, 'ч').replace(/sh/g, 'ш').replace(/zh/g, 'ж');
        return s.split('').map(ch => map[ch] || ch).join('');
    }

    private normalize(str: string): string {
        return this.toCanonical(str).replace(/[\s\-_().,]/g, '');
    }

    async fetch(html: string, groupName: string): Promise<number | undefined> {
        if (!groupName || typeof groupName !== 'string') {
            return undefined;
        }

        const inputClean = groupName.trim();
        if (!inputClean) return undefined;

        const inputLower = inputClean.toLowerCase();
        const inputCanonical = this.toCanonical(inputClean);
        const inputNormalized = this.normalize(inputClean);

        const $ = cheerio.load(html);

        interface GroupCandidate {
            id: number;
            names: string[];
        }

        const candidates: GroupCandidate[] = [];

        $('a').each((_, el) => {
            const $el = $(el);

            const href = $el.attr('href') || '';
            const dataId = $el.attr('data-id');

            let id: number | undefined = undefined;
            if (dataId && /^\d+$/.test(dataId.trim())) {
                id = parseInt(dataId.trim(), 10);
            } else {
                const match = href.match(/[?&]id=(\d+)/) || href.match(/=(\d+)/);
                if (match) {
                    id = parseInt(match[1], 10);
                }
            }

            if (!id || isNaN(id)) return;

            const nameList: string[] = [];

            const dataGroup = $el.attr('data-group');
            if (dataGroup && dataGroup.trim()) nameList.push(dataGroup.trim());

            const dataDirItem = $el.attr('data-dir-item');
            if (dataDirItem && dataDirItem.trim()) nameList.push(dataDirItem.trim());

            const text = $el.text().trim();
            if (text) nameList.push(text);

            if (nameList.length > 0) {
                candidates.push({ id, names: nameList });
            }
        });

        // Pass 1: Exact case-insensitive match
        for (const candidate of candidates) {
            for (const name of candidate.names) {
                if (name.toLowerCase() === inputLower) {
                    return candidate.id;
                }
            }
        }

        // Pass 2: Canonical transliterated match
        for (const candidate of candidates) {
            for (const name of candidate.names) {
                if (this.toCanonical(name) === inputCanonical) {
                    return candidate.id;
                }
            }
        }

        // Pass 3: Normalized match (ignoring spaces, dashes, punctuation)
        for (const candidate of candidates) {
            for (const name of candidate.names) {
                if (this.normalize(name) === inputNormalized) {
                    return candidate.id;
                }
            }
        }

        return undefined;
    }
}
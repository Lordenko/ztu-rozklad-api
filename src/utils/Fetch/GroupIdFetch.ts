import * as cheerio from 'cheerio';

export class GroupIdFetch {
    async fetch(html: string, groupName: string) {
        const $ = cheerio.load(html)
        const groupHref = $('a').filter((_, el) => ($(el).text() === groupName)).first().attr('href')
        const groupHrefMatch = groupHref?.match(/=(\d+)/)

        if (groupHrefMatch) return parseInt(groupHrefMatch[1]);
        return undefined
    }
}
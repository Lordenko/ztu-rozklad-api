import * as cheerio from 'cheerio';

export class GroupIdFetch {
    async fetch(html: string, groupName: string) {
        const $ = cheerio.load(html)
        const groupHref = $('a').filter((_, el) => ($(el).text() === groupName)).first().attr('href')
        console.log(groupHref);

        const groupHrefMatch = groupHref?.match(/=(\d+)/)
        console.log(groupHrefMatch);

        if (groupHrefMatch) return parseInt(groupHrefMatch[1]);
        return undefined
    }
}
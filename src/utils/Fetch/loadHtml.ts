import * as cheerio from 'cheerio';

// htmlparser2 замість стандартного parse5 — у кілька разів швидше на великих сторінках
export function loadHtml(html: string) {
    return cheerio.load(html, { xml: { xmlMode: false, decodeEntities: true } });
}

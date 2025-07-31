import { request } from 'undici';
import * as cheerio from 'cheerio';

export async function fetchGroup(id: number): Promise<string> {
    const url = `https://rozklad.ztu.edu.ua/schedule/group?id=${id}`;
    const cookie = 'PHPSESSID=2l7tpri3414l2spv8ovgca19ob';

    console.time('request')
    const { body } = await request(url, {
        headers: {
            'Cookie': cookie,
        }
    });
    console.timeEnd('request')

    const html = await body.text();

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<script[^>]*>/i); // КАСТИЛЬ ДЛЯ МАЛЕНЬКОГО ВИГРАШУ В ЧАСІ
    const bodyHtml = bodyMatch ? bodyMatch[1] : '';

    const $ = cheerio.load(bodyHtml);

    return $.html()

}

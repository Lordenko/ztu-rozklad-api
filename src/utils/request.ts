import { log } from 'console';
import { request } from 'undici';
import { rozkladAuth } from './Auth/rozkladAuth';

export async function customRequest(id: number): Promise<string> {
    const url = `https://rozklad.ztu.edu.ua/schedule/group?id=${id}`;
    const cookie = 'PHPSESSID=2l7tpri3414l2s3pv8ovgca19ob';

    const { statusCode, body } = await request(url, {
        headers: {
            'Cookie': cookie,
        }
    });

    if (statusCode > 299 && statusCode < 400) {
        rozkladAuth()
    }
    
    return await body.text()
}
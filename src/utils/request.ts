import { request } from 'undici';

export async function customRequest(id: number): Promise<string> {
    const url = `https://rozklad.ztu.edu.ua/schedule/group?id=${id}`;
    const cookie = 'PHPSESSID=2l7tpri3414l2spv8ovgca19ob';

    const { body } = await request(url, {
        headers: {
            'Cookie': cookie,
        }
    });
    
    return await body.text();
}
import { request } from 'undici';

export class SimpleRequest {
    async request(url: string): Promise<string> {
        const { body } = await request(url)
        return await body.text()
    }
}
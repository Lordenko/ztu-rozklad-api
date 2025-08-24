import { request, FormData } from 'undici';
import { DataBase } from '../DataBase/DataBase';

export class RozkladRequest {
    private loginUrl: string = 'https://rozklad.ztu.edu.ua/schedule/users/login';

    private attempts: number = 0;
    private allowAttempts: number = 2;

    private username: string;
    private db: DataBase

    constructor(
        username: string
    ) {
        this.username = username;
        this.db = new DataBase()
    }

    public async request(
        id: number
    ): Promise<string> {
        const url = `https://rozklad.ztu.edu.ua/schedule/group?id=${id}`;
        const userData = this.db.getDataOfName(this.username)

        return await this.connectToken(url, userData.name, userData.password, userData.tokenRozklad);
    }

    private async connectToken(
        url: string,
        userName: string,
        password: string,
        tokenValue?: string | null,
    ): Promise<string> {
        const cookieName = 'PHPSESSID';
        const cookie = `${cookieName}=${tokenValue}`;

        if (this.attempt()) {

            const { statusCode, body } = await request(url, {
                headers: {
                    Cookie: cookie,
                },
            });

            if (statusCode > 299 && statusCode < 400) {
                console.log(`Unsuccessful attempt to rozklad #${this.attempts} (${userName})`);
                return await this.connectPassword(userName, password, url);
            } else {
                console.log(`Successful attempt to rozklad #${this.attempts} (${userName})`);
                this.db.updateData(userName, undefined, tokenValue)
                return body.text();
            }
        } else {
            const errorText = `Attempts are over of auth (${userName})`;
            console.log(errorText);
            return errorText;
        }
    }

    private async connectPassword(
        username: string,
        password: string,
        url: string,
    ): Promise<string> {
        const formData = this.getFormData(username, password);

        const response = await request(this.loginUrl, {
            method: 'POST',
            body: formData,
        });

        const rawCookies: string | string[] | undefined =
            response.headers['set-cookie'];
        const cookieValue = this.getCookie(rawCookies);

        if (cookieValue) {
            return await this.connectToken(
                url,
                username,
                password,
                cookieValue,
            );
        }

        return await response.body.text();
    }

    private getCookie(
        rawCookies: string | string[] | undefined,
    ): string | undefined {
        if (rawCookies) {
            if (typeof rawCookies === 'string') {
                let cookies = rawCookies.split(';');
                cookies = cookies.filter((cookie) =>
                    cookie.includes('PHPSESSID'),
                ) as string[];
                cookies = cookies[0].split('=');

                const cookieValue = cookies[1];

                return cookieValue;
            }
        }
    }

    private getFormData(
        username: string,
        password: string
    ): FormData {
        const formData = new FormData();
        formData.append('login', username);
        formData.append('password', password);
        return formData;
    }

    private attempt(): boolean {
        if (this.attempts < this.allowAttempts) {
            this.attempts++;
            return true;
        } else {
            return false;
        }
    }
}

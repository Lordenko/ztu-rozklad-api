import { request, FormData } from 'undici';
import { User } from '../../models/User';

export class RozkladRequest {
    private loginUrl: string = 'https://rozklad.ztu.edu.ua/schedule/users/login';

    private attempts: number = 0;
    private allowAttempts: number = 2;

    private db: User

    constructor() {
        this.db = new User()
    }

    public async request(
        id: number
    ): Promise<string> {
        return await this.requestUrl(`https://rozklad.ztu.edu.ua/schedule/group?id=${id}`);
    }

    // будь-яка сторінка rozklad (розклад групи, список груп) доступна лише після входу
    public async requestUrl(url: string): Promise<string> {
        const userData = this.db.getDataOfNameSuperUser()

        if (!userData) {
            const errorText = 'Rozklad requires auth, but superuser does not exist';
            console.log(errorText);
            return errorText;
        }

        return await this.connectToken(url, userData.name, userData.password, userData.tokenRozklad);
    }

    public async validate(username: string, password: string): Promise<boolean> {
        const response = await request(this.loginUrl, {
            method: 'POST',
            body: this.getFormData(username, password),
        });
        await response.body.dump();

        // успішний вхід — переадресація, невдалий — знову сторінка входу (200)
        return response.statusCode >= 300 && response.statusCode <= 399;
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

            // без входу rozklad переадресовує на сторінку входу
            if (statusCode > 299 && statusCode < 400) {
                await body.dump();
                console.log(`Unsuccessful attempt to rozklad #${this.attempts} (${userName})`);
                return await this.connectPassword(userName, password, url);
            } else {
                console.log(`Successful attempt to rozklad (${userName})`);
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
            await response.body.dump();
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
        if (!rawCookies) return undefined;

        // undici віддає рядок для одного set-cookie і масив для кількох
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        const sessionCookie = cookies
            .map((cookie) => cookie.split(';')[0].trim())
            .find((cookie) => cookie.startsWith('PHPSESSID='));

        return sessionCookie?.split('=')[1];
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

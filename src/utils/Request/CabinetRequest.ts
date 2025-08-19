import { request, FormData } from 'undici';
import { DataBase } from '../DataBase/DataBase';
import * as cheerio from 'cheerio';

import { CSRFType } from '../../classes/data/csrf';

export class CabinetRequest {
    private loginUrl: string = 'https://cabinet.ztu.edu.ua/site/login';

    private attempts: number = 0;
    private allowAttempts: number = 2;

    private db: DataBase

    constructor() {
        this.db = new DataBase()
    }

    private async getCsrfToken(): Promise<CSRFType> {

        const { body, headers } = await request(this.loginUrl, { method: "GET" })
        const html = await body.text()
        const $ = cheerio.load(html)

        const token = $('input[name="_csrf-frontend"]').attr('value') as string;

        const rawCookies: string | string[] | undefined = headers['set-cookie'];
        const cookieValue = this.getCookie(rawCookies);

        return {
            "token": token,
            "cookie": cookieValue
        }
    }

    private getFormData(
        username: string,
        password: string,
        csrfToken: string): FormData {
        const formData = new FormData();
        formData.append('LoginForm[username]', username);
        formData.append('LoginForm[password]', password);
        formData.append('_csrf-frontend', csrfToken);
        return formData;
    }

    private getCookie(
        rawCookies: string | string[] | undefined,
    ): string | undefined {

        if (rawCookies && Array.isArray(rawCookies)) {
            let cookie: string = '';
            rawCookies.forEach(element => {
                const elementSplit = element.split(';')
                if (elementSplit[0]) cookie += `${elementSplit[0]}; `
            });

            return cookie.trim()
        }
    }


    private async connectPassword(
        username: string,
        password: string,
    ): Promise<string> {

        const csrf = await this.getCsrfToken()
        if (csrf['token'] && csrf['cookie']) {

            const formData = this.getFormData(username, password, csrf['token']);

            const response = await request(this.loginUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    Cookie: csrf['cookie']
                }
            });

            const rawCookies: string | string[] | undefined = response.headers['set-cookie'];
            const cookieValue = this.getCookie(rawCookies);

            if (cookieValue) {
                return await this.connectToken(
                    username,
                    password,
                    cookieValue,
                );
            }

            return '1';
        }

        return 'ти дебіл'

    }

    async connectToken(
        username: string,
        password: string,
        cookieValue: string
    ): Promise<string> {

        const cookieName = 'advanced-frontend'
        const cookie = `${cookieName}=${cookieValue};`

        if (this.attempt()) {
            const { statusCode, body } = await request('https://cabinet.ztu.edu.ua/site/schedule', {
                method: 'GET',
                headers: {
                    Cookie: cookie
                }
            });

            const bodyText = await body.text()
            if (this.checkSuccessfulConnect(statusCode, bodyText)) {
                console.log(`Successful attempt to cabinet #${this.attempts} (${username})`);
                this.db.updateData(username, cookieValue, undefined)

                return await body.text();
            } else {
                console.log(`Unsuccessful attempt to cabinet #${this.attempts} (${username})`);
                return this.connectPassword(username, password)
            }

        } else {
            const errorText = `Attempts to cabinet are over of auth (${username})`;
            console.log(errorText);
            return errorText;
        }


    }

    private attempt(): boolean {
        if (this.attempts < this.allowAttempts) {
            this.attempts++;
            return true;
        } else {
            return false;
        }
    }

    private checkSuccessfulConnect(statusCode: number, bodyText: String) {
        if (statusCode === 200 && bodyText.toLowerCase().includes('logout')) return true
        else return false
    }
}
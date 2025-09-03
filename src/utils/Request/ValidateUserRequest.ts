import { request, FormData } from 'undici';
import * as cheerio from 'cheerio';

import { CSRFType } from '../../classes/type/csrf';

export class ValidateUserRequest {
    private loginUrl: string = 'https://rozklad.ztu.edu.ua/schedule/users/login';

    async request(username: string, password: string): Promise<boolean> {
        const formData = this.getFormData(username, password);

        const { body, statusCode } = await request(this.loginUrl, {
            method: 'POST',
            body: formData,
        });

        if (statusCode >= 300 && statusCode <= 399) return true
        else return false

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
}

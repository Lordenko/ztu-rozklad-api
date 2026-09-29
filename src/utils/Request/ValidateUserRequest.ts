import { CabinetRequest } from './CabinetRequest';
import { RozkladRequest } from './RozkladRequest';

export class ValidateUserRequest {
    // superuser — обліковий запис rozklad.ztu.edu.ua, від імені якого завантажується розклад;
    // user — обліковий запис cabinet.ztu.edu.ua
    async request(type: string, username: string, password: string): Promise<boolean> {
        if (type === 'superuser') {
            return await new RozkladRequest().validate(username, password);
        }

        return await new CabinetRequest(username).validate(username, password);
    }
}

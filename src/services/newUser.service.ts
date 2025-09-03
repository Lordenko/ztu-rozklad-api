import { User } from '../models/User';

import { ValidateUserRequest } from '../utils/Request/ValidateUserRequest';


export async function insertData(type: string, name: string, password: string) {

    const validateUserRequest = new ValidateUserRequest()
    const request = await validateUserRequest.request(name, password)
    if (!request) return { status: 400, description: 'Некоректні дані входу' }

    const userModel = new User();
    const result = userModel.new(type, name, password);
    if (!result) return { status: 400, description: 'Помилка бази даних' }

    return { status: 200 }
}

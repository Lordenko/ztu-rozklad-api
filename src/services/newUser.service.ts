import { User } from '../models/User';

export async function insertData(type: string, name: string, password: string) {
    const userModel = new User();
    return userModel.new(type, name, password);
}

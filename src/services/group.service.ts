import { fetchRozklad } from '../utils/fetchRozklad';
import { RozkladRequest } from '../utils/Requests/RozkladRequest';
import { DataBase } from '../utils/DataBase/DataBase.js';

export async function fetchGroup(id: number, username: string | undefined) {
    let name: string = ''

    if (username) {
        name = username
    } else {
        const dataBase = new DataBase()
        const nameOfSuperUser = dataBase.getNameOfSuperUser();

        if (nameOfSuperUser) {
            name = nameOfSuperUser;
        } else {
            return {
                'message': 'SuperUser is corrupted or not exist!'
            }
        }
    }

    const rozkladRequest = new RozkladRequest(name);
    const rozkladData = await rozkladRequest.request(id);

    return fetchRozklad(id, rozkladData);
}

import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

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

    console.time("request");
    const rozkladRequest = new RozkladRequest(name);
    const rozkladData = await rozkladRequest.request(id);
    console.timeEnd("request");

    console.time("fetch");
    const rozkladFetch = new RozkladFetch();
    const rozkladJson = await rozkladFetch.fetch(rozkladData)
    // console.log(rozkladJson);
    console.timeEnd("fetch");

    const cabinetRequest = new CabinetRequest(name)
    const cabinetFetch = new CabinetFetch(cabinetRequest)
    const cabinetJson = cabinetFetch.fetch()


    return cabinetJson;
}

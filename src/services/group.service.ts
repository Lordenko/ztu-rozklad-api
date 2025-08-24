import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';
import { DataBase } from '../utils/DataBase/DataBase.js';

import { CabinetRequest } from '../utils/Request/CabinetRequest';
import { fork } from 'child_process';

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

    console.time('for')
    const cabinetRequest = new CabinetRequest('ipz235_shdr')
    for (let i = 0; i <= 7; i++) {
        await cabinetRequest.request(16, i)
    }
    console.timeEnd('for')

    // const temp = await cabinetRequest.request(16, 2)

    return rozkladJson;
}

import { SimpleRequest } from '../utils/Request/SimpleRequest'
import { GroupIdFetch } from '../utils/Fetch/GroupIdFetch';

export async function getGroupId(name: string) {
    const url = 'https://rozklad.ztu.edu.ua/schedule/group/list'
    const simpleRequest = new SimpleRequest()
    const html = await simpleRequest.request(url)

    const groupIdFetch = new GroupIdFetch()
    const groupId = await groupIdFetch.fetch(html, name)

    console.log(groupId);

    if (groupId) return { status: 200, groupId: groupId }
    else return { status: 400, description: 'Group do not found' }

}

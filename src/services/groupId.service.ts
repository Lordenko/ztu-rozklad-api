import { RozkladRequest } from '../utils/Request/RozkladRequest'
import { GroupIdFetch } from '../utils/Fetch/GroupIdFetch';

export async function getGroupId(name: string) {
    const url = 'https://rozklad.ztu.edu.ua/schedule/group/list'
    // список груп теж доступний лише після входу
    const html = await new RozkladRequest().requestUrl(url)

    const groupIdFetch = new GroupIdFetch()
    const groupId = await groupIdFetch.fetch(html, name)

    if (groupId) return { status: 200, groupId: groupId }
    else return { status: 400, description: 'Group do not found' }

}

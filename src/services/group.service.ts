import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

import { Cache } from '../models/Cache';

import { ScheduleData } from '../classes/type/ScheduleData';
import { Lesson } from '../classes/type/ScheduleData';

export async function fetchGroup(id: number, username?: string) {
    const status = username ? 'super' : 'common'

    const cacheModel = new Cache()
    const cacheData = cacheModel.getDataByGroup(id, status)
    if (cacheData) return cacheData

    const rozkladRequest = new RozkladRequest();
    const rozkladData = await rozkladRequest.request(id);

    const rozkladFetch = new RozkladFetch();
    const { data: rozkladJson, selectiveDays } = await rozkladFetch.fetch(rozkladData);

    // Without a cabinet account there is nothing to merge, and the rozklad page
    // itself needs no superuser any more.
    if (!username) {
        const data = { data: rozkladJson, selectiveDays }
        cacheModel.insert(id, data, 'common')
        return data;
    }


    const cabinetRequest = new CabinetRequest(username);
    const cabinetFetch = new CabinetFetch(cabinetRequest);
    const cabinetJson = await cabinetFetch.fetch();


    const resultJson = getResultJson(rozkladJson, cabinetJson);

    const data = { data: resultJson, selectiveDays };
    cacheModel.insert(id, data, status)
    return data;
}


function getResultJson(rozkladJson: ScheduleData, cabinetJson: ScheduleData) {
    Object.entries(cabinetJson).forEach(([week, weekData]) => {
        if (!rozkladJson[week]) {
            console.warn(`Пропущено тиждень ${week} - немає в розкладі`);
            return;
        }

        Object.entries(weekData).forEach(([day, dayData]) => {
            if (!rozkladJson[week][day]) {
                console.warn(`Пропущено день ${day} у тижні ${week} - немає в розкладі`);
                return;
            }

            const hourIndex = getHourIndex(rozkladJson[week][day]);

            Object.entries(dayData).forEach(([hour, hourData]) => {
                const rozkladHour = hourIndex.get(normalizeHour(hour));

                if (!rozkladHour) {
                    console.warn(`Пропущено годину ${hour} у ${day}, тиждень ${week} - немає в розкладі`);
                    return;
                }

                hourData.forEach((lesson: Lesson) => {
                    const hourDataRozklad = rozkladJson[week][day][rozkladHour];

                    hourDataRozklad.forEach((rozkladLesson: Lesson) => {
                        if (
                            rozkladLesson.subject === lesson.subject &&
                            JSON.stringify(rozkladLesson.teacher) === JSON.stringify(lesson.teacher) &&
                            JSON.stringify(rozkladLesson.room) === JSON.stringify(lesson.room)
                        ) {

                            rozkladLesson.description = lesson.description;
                        }
                    });
                });
            });
        });
    });

    return rozkladJson;
}

// The two sources spell the same slot differently ('08:30-09:50' against
// '08:30 - 09:50'), so hours are matched on their digits only.
function getHourIndex(dayData: { [hour: string]: Lesson[] }): Map<string, string> {
    return new Map(Object.keys(dayData).map((hour) => [normalizeHour(hour), hour]));
}

function normalizeHour(hour: string): string {
    return hour.replace(/\s+/g, '');
}

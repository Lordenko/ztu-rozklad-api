import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

import { User } from '../models/User';
import { Cache } from '../models/Cache';

import { ScheduleData } from '../classes/type/ScheduleData';
import { Lesson } from '../classes/type/ScheduleData';

export async function fetchGroup(id: number, username?: string) {
    const name = username ?? new User().getNameOfSuperUser();
    console.log(name);

    if (!name) return { message: 'SuperUser is corrupted or does not exist!' };

    const status = username ? 'super' : 'common'

    const cacheModel = new Cache()
    const cacheData = cacheModel.getDataByGroup(id, status)
    if (cacheData) return cacheData

    const rozkladRequest = new RozkladRequest();
    const rozkladData = await rozkladRequest.request(id);

    const rozkladFetch = new RozkladFetch();
    const { data: rozkladJson, selectiveDays } = await rozkladFetch.fetch(rozkladData);

    if (!username) {
        const data = { data: rozkladJson, selectiveDays }
        cacheModel.insert(id, data, status)
        return data;
    }

    const cabinetRequest = new CabinetRequest(name);
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
            // console.warn(`Пропущено тиждень ${week} - немає в розкладі`);
            return;
        }

        Object.entries(weekData).forEach(([day, dayData]) => {
            if (!rozkladJson[week][day]) {
                // console.warn(`Пропущено день ${day} у тижні ${week} - немає в розкладі`);
                return;
            }

            Object.entries(dayData).forEach(([hour, hourData]) => {
                if (!rozkladJson[week][day][hour]) {
                    // console.warn(`Пропущено годину ${hour} у ${day}, тиждень ${week} - немає в розкладі`);
                    return;
                }

                hourData.forEach((lesson: Lesson) => {
                    const hourDataRozklad = rozkladJson[week][day][hour];

                    hourDataRozklad.forEach((rozkladLesson: Lesson, rozkladLessonIndex: number) => {
                        if (
                            rozkladLesson.subject === lesson.subject &&
                            JSON.stringify(rozkladLesson.teacher) === JSON.stringify(lesson.teacher) &&
                            JSON.stringify(rozkladLesson.room) === JSON.stringify(lesson.room)
                        ) {
                            rozkladJson[week][day][hour][rozkladLessonIndex].description = lesson.description;
                        }
                    });
                });
            });
        });
    });

    return rozkladJson;
}

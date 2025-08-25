import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

import { DataBase } from '../utils/DataBase/DataBase.js';

import { ScheduleData } from '../classes/type/ScheduleData';
import { Lesson } from '../classes/type/ScheduleData';

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
    const rozkladFetch = new RozkladFetch();
    const rozkladJson = await rozkladFetch.fetch(rozkladData)

    if (username !== undefined) {
        const cabinetRequest = new CabinetRequest(name)
        const cabinetFetch = new CabinetFetch(cabinetRequest)
        const cabinetJson = await cabinetFetch.fetch()
        console.time('resultjson')
        const resultJson = getResultJson(rozkladJson, cabinetJson)
        console.timeEnd('resultjson')
        return resultJson;
    } else {
        return rozkladJson;
    }

}

function getResultJson(rozkladJson: ScheduleData, cabinetJson: ScheduleData) {
    Object.entries(cabinetJson).forEach(([week, weekData]) => {
        Object.entries(weekData).forEach(([day, dayData]) => {
            Object.entries(dayData).forEach(([hour, hourData]) => {
                hourData.forEach((lesson: Lesson, index: number) => {
                    const hourDataRozklad = rozkladJson[week][day][hour]
                    if (hourDataRozklad) {
                        hourDataRozklad.forEach((rozkladLesson: Lesson, rozkladLessonIndex: number) => {
                            if (rozkladLesson.subject === lesson.subject &&
                                JSON.stringify(rozkladLesson.teacher) === JSON.stringify(lesson.teacher) &&
                                JSON.stringify(rozkladLesson.room) === JSON.stringify(lesson.room)) {
                                rozkladJson[week][day][hour][rozkladLessonIndex].description = lesson.description
                            }
                        })
                    }

                })
            })
        })
    })

    return rozkladJson;
}
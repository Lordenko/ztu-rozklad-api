import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

import { User } from '../models/User';
import { Cache } from '../models/Cache';

import { ScheduleData } from '../classes/type/ScheduleData';
import { Lesson } from '../classes/type/ScheduleData';

export async function fetchGroup(id: number, username?: string) {
    // Авторизація на rozklad.ztu.edu.ua наразі не потрібна, тому superuser не обов'язковий.
    // Розкоментувати, якщо авторизацію повернуть (див. RozkladRequest).
    // const superUserName = username ?? new User().getNameOfSuperUser();
    // if (!superUserName) return { message: 'SuperUser is corrupted or does not exist!' };

    const status = username ? 'super' : 'common'

    // вибіркові для 'super' залежать від користувача, тому кеш окремий для кожного
    const cacheModel = new Cache()
    const cacheData = cacheModel.getDataByGroup(id, username)
    if (cacheData) return cacheData

    const rozkladRequest = new RozkladRequest();
    const rozkladData = await rozkladRequest.request(id);

    const rozkladFetch = new RozkladFetch();
    const { data: rozkladJson, selectiveDays } = await rozkladFetch.fetch(rozkladData);

    if (status === 'common') {
        const data = { data: rozkladJson, selectiveDays }
        cacheModel.insert(id, data, status)
        return data;
    }


    const cabinetRequest = new CabinetRequest(username as string);
    const cabinetFetch = new CabinetFetch(cabinetRequest);
    const cabinetJson = await cabinetFetch.fetch();


    const resultJson = getResultJson(rozkladJson, cabinetJson);
    const userSelectiveDays = getUserSelectiveDays(resultJson, cabinetJson, selectiveDays);

    const data = { data: resultJson, selectiveDays: userSelectiveDays };
    cacheModel.insert(id, data, status, username)
    return data;
}


function isSameLesson(rozkladLesson: Lesson, cabinetLesson: Lesson): boolean {
    return (
        rozkladLesson.subject === cabinetLesson.subject &&
        JSON.stringify(rozkladLesson.teacher) === JSON.stringify(cabinetLesson.teacher) &&
        JSON.stringify(rozkladLesson.room) === JSON.stringify(cabinetLesson.room)
    );
}

function getResultJson(rozkladJson: ScheduleData, cabinetJson: ScheduleData) {
    // cabinetJson містить лише пари користувача (включно з його вибірковими)
    // і лише за перевірені тижні — решту тижнів лишаємо без змін
    Object.keys(cabinetJson).forEach((week) => {
        if (!rozkladJson[week]) {
            console.warn(`Пропущено тиждень ${week} - немає в розкладі`);
            return;
        }

        Object.entries(rozkladJson[week]).forEach(([day, dayData]) => {
            Object.entries(dayData).forEach(([hour, hourData]) => {
                const cabinetLessons = cabinetJson[week][day]?.[hour] ?? [];

                const lessons = hourData.filter((rozkladLesson: Lesson) => {
                    const cabinetLesson = cabinetLessons.find((lesson: Lesson) => isSameLesson(rozkladLesson, lesson));

                    if (cabinetLesson?.description !== undefined) {
                        rozkladLesson.description = cabinetLesson.description;
                    }

                    // вибіркові, яких немає в кабінеті користувача, він не обирав
                    return !rozkladLesson.selective || cabinetLesson !== undefined;
                });

                if (lessons.length > 0) dayData[hour] = lessons;
                else delete dayData[hour];
            });

            if (Object.keys(dayData).length === 0) delete rozkladJson[week][day];
        });
    });

    return rozkladJson;
}

function getUserSelectiveDays(resultJson: ScheduleData, cabinetJson: ScheduleData, selectiveDays: string[]): string[] {
    return selectiveDays.filter((dayText: string) => {
        const [week, day] = dayText.split(', ');
        if (!(week in cabinetJson)) return true;

        return Object.values(resultJson[week]?.[day] ?? {})
            .some((lessons: Lesson[]) => lessons.some((lesson: Lesson) => lesson.selective));
    });
}

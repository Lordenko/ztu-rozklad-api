import { RozkladFetch } from '../utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../utils/Request/RozkladRequest';

import { CabinetFetch } from '../utils/Fetch/CabinetFetch';
import { CabinetRequest } from '../utils/Request/CabinetRequest';

import { User } from '../models/User';
import { Cache } from '../models/Cache';

import { ScheduleData } from '../classes/type/ScheduleData';
import { Lesson } from '../classes/type/ScheduleData';

export async function fetchGroup(id: number, username?: string) {
    const status = username ? 'super' : 'common'

    // вибіркові для 'super' залежать від користувача, тому кеш окремий для кожного
    const cacheModel = new Cache()
    const cacheData = cacheModel.getDataByGroup(id, username)
    if (cacheData) return cacheData

    // rozklad.ztu.edu.ua доступний лише після входу, який виконується від імені superuser
    if (!new User().getNameOfSuperUser()) return { message: 'SuperUser is corrupted or does not exist!' };

    // rozklad і cabinet не залежать одне від одного — завантажуємо паралельно
    const [{ data: rozkladJson, selectiveDays }, cabinetJson] = await Promise.all([
        fetchRozklad(id),
        (status === 'super')
            ? new CabinetFetch(new CabinetRequest(username as string)).fetch()
            : undefined,
    ]);

    if (!cabinetJson) {
        const data = { data: rozkladJson, selectiveDays }
        cacheModel.insert(id, data, status)
        return data;
    }


    const resultJson = getResultJson(rozkladJson, cabinetJson);
    const userSelectiveDays = getUserSelectiveDays(resultJson, cabinetJson, selectiveDays);

    const data = { data: resultJson, selectiveDays: userSelectiveDays };
    cacheModel.insert(id, data, status, username)
    return data;
}


async function fetchRozklad(id: number) {
    const rozkladRequest = new RozkladRequest();
    const rozkladData = await rozkladRequest.request(id);

    const rozkladFetch = new RozkladFetch();
    return await rozkladFetch.fetch(rozkladData);
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

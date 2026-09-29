import { CabinetRequest } from "../Request/CabinetRequest"
import { CabinetValidate } from "../../classes/Validate/CabinetValidate";
import { ScheduleData } from "../../classes/type/ScheduleData";

import { loadHtml } from './loadHtml';

export class CabinetFetch {
    private cabinetRequest: CabinetRequest
    private firstDayInWeek: number = 1

    constructor(cabinetRequest: CabinetRequest) {
        this.cabinetRequest = cabinetRequest
    }

    async fetch(): Promise<ScheduleData> {
        const data: ScheduleData = {}

        // перший запит послідовний: якщо сесія застаріла, він оновить cookie для решти.
        // Це сторінка поточного дня поточного тижня — її теж розбираємо
        const $actual = loadHtml(await this.cabinetRequest.request())
        this.parsePage($actual, data)

        const actualWeekNumber: number = this.getWeekNumber($actual);
        const weeks: number[] = this.getWeeks(actualWeekNumber);

        await Promise.all(weeks.map(async (week: number) => {
            // з будь-якої сторінки тижня видно, у які дні є пари (.sch-day без .is-empty)
            let $known = $actual
            let knownDay = this.getActiveDay($actual)

            if (week !== actualWeekNumber) {
                $known = loadHtml(await this.cabinetRequest.request(this.getUrl(week, this.firstDayInWeek)))
                knownDay = this.firstDayInWeek
                this.parsePage($known, data)
            }

            const days = this.getNotEmptyDays($known).filter((day: number) => day !== knownDay)

            await Promise.all(days.map(async (day: number) => {
                const $ = loadHtml(await this.cabinetRequest.request(this.getUrl(week, day)))
                this.parsePage($, data)
            }))
        }))

        return data;
    }

    private parsePage($: any, data: ScheduleData) {
        // не сторінка розкладу (напр. не вдалося увійти) — тиждень не вважаємо перевіреним
        if ($('.sch-bar-day').length === 0) return

        const weekName = this.getWeekName($)
        const dayName = this.getDayName($)

        // тиждень позначаємо як перевірений, навіть якщо пар немає
        data[weekName] ??= {};

        // .sch-rest — вибіркові потоку, які користувач не обирав
        $('.sch-pair').not('.sch-rest .sch-pair').each((_: number, pair: any) => {
            const hour = this.getHour($, pair);
            const validate = this.createValidate($, pair)
            this.updateData(data, validate, weekName, dayName, hour)
        });
    }

    private createValidate($: any, pair: any): CabinetValidate {
        const subject = this.getSubject($, pair);
        const teacher = this.getTeacher($, pair);
        const room = this.getRoom($, pair);
        const description = this.getDescription($, pair)

        return new CabinetValidate(subject, teacher, room, description)
    }

    private updateData(data: ScheduleData, validate: CabinetValidate, weekName: string, dayName: string, hour: string) {
        if (validate.checkIsValid()) {
            data[weekName] ??= {};
            data[weekName][dayName] ??= {};
            data[weekName][dayName][hour] ??= [];

            data[weekName][dayName][hour].push(validate.toDictionary());
        }
    }

    private getDescription($: any, pair: any): string | undefined {
        // якщо викладач не надав інформацію, замість .sch-link буде .sch-nolink
        const link = $(pair).find('.sch-link');
        if (link.length === 0) return undefined;

        return link.text().replace(/\s+/g, ' ').trim();
    }


    private getSubject($: any, pair: any): string {
        return $(pair).find('.sch-subject').text().trim();
    }

    private getTeacher($: any, pair: any): string[] {
        const teachersText: string = $(pair).find('.sch-teacher').text().trim()
        return teachersText.split(', ')
    }

    private getRoom($: any, pair: any): string[] {
        const roomsText: string = $(pair).find('.sch-chip-room').text();
        return roomsText
            .replace(/^\s*ауд\.\s*/, '')
            .split(' / ')
            .map((room: string) => room.replace(/\s+/g, ' ').trim())
            .map((room: string) => (room.includes('Дист') ? 'Дистанційно' : room))
            .filter(Boolean);
    }


    private getDayName($: any): string {
        return $('.sch-bar-day').text().trim()
    }

    private getHour($: any, pair: any): string {
        return $(pair).find('.sch-time .sch-hh').text().trim();
    }

    private getWeekName($: any): string {
        const weekNumber = this.getWeekNumber($)
        const weekName = weekNumber === 0 ? 0 : (weekNumber % 2 === 0 ? 1 : 2)
        return `Тиждень ${weekName}`
    }

    private getWeekNumber($: any): number {
        return parseInt($('a.sch-week.is-active').first().text().trim())
    }

    private getDayNumber($: any, day: any): number | undefined {
        const dayMatch = ($(day).attr('href') ?? '').match(/day=(\d+)/)
        return dayMatch ? parseInt(dayMatch[1]) : undefined
    }

    private getActiveDay($: any): number | undefined {
        return this.getDayNumber($, $('.sch-picker a.sch-day.is-active').first())
    }

    private getNotEmptyDays($: any): number[] {
        const days: number[] = [];

        $('.sch-picker a.sch-day').not('.is-empty').each((_: number, day: any) => {
            const dayNumber = this.getDayNumber($, day)
            if (dayNumber !== undefined) days.push(dayNumber)
        });

        return days;
    }

    private getWeeks(actualWeekNumber: number): number[] {
        const lastWeekNumber: number = 16
        const checkWeeks: number = 2

        const weeks: number[] = []
        for (let week = actualWeekNumber; week <= Math.min(actualWeekNumber + checkWeeks - 1, lastWeekNumber); week++) {
            weeks.push(week)
        }

        return weeks;
    }

    private getUrl(week: number, day: number): string {
        return `https://cabinet.ztu.edu.ua/site/schedule?week=${week}&day=${day}`
    }
}

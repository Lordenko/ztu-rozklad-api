import { CabinetRequest } from "../Request/CabinetRequest"
import { CabinetValidate } from "../../classes/data/Validate/CabinetValidate";
import { ScheduleData } from "../../classes/type/ScheduleData";

import * as cheerio from 'cheerio';

export class CabinetFetch {
    private cabinetRequest: CabinetRequest

    constructor(cabinetRequest: CabinetRequest) {
        this.cabinetRequest = cabinetRequest
    }

    async fetch(): Promise<ScheduleData> {
        const data: ScheduleData = {}
        const actualWeekNumber: number = await this.getActualWeekNumber();
        const urls: Array<string> = this.getUrls(actualWeekNumber);

        for (const url of urls) {
            const html = await this.cabinetRequest.request(url)
            const $ = cheerio.load(html)

            const weekName = this.getWeekName($)
            const dayName = this.getDayName($)

            $('.pair').each((_, pair) => {
                if (pair) {
                    const hour = this.getHour($, pair);
                    const validate = this.createValidate($, pair)
                    this.updateData(data, validate, weekName, dayName, hour)
                }
            });
        }

        return data;
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
        const div = $(pair).find('div')[8];
        let text: string = $(div).text();
        text = text.replace(/\s+/g, ' ').trim()
        return (text.includes('Викладач ще не надав інформацію')) ? undefined : text;
    }


    private getSubject($: any, pair: any): string {
        return $($(pair).find('.date>.type')[0]).text().trim();
    }

    private getTeacher($: any, pair: any): string[] {
        const teachersText: string = $($(pair).find('.date>.type')[3]).text().trim()
        return teachersText.split(', ')
    }

    private getRoom($: any, pair: any): string[] {
        const roomsText = $($(pair).find('.date>.type')[2]).text();
        return roomsText
            .split(' / ')
            .map((room: string) => room.replace(/\s+/g, ' ').trim())
            .map((room: string) => (room.includes('Дист') ? room = 'Дистанційно' : room = room))
            .filter(Boolean);
    }


    private getDayName($: any): string {
        return this.capitalizeFirstLetter($('.active>a').last().text().trim())
    }

    private capitalizeFirstLetter(val: string) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    private getHour($: any, pair: any): string {
        return $(pair).find('.date>.time').text().trim();
    }

    private getWeekName($: any): string {
        const weekNumber = ($('.active>a').first().text().trim() % 2) + 1
        return `Тиждень ${weekNumber}`
    }

    private getWeekNumber($: any): number {
        return parseInt($('.active>a').first().text().trim())
    }

    private async getActualWeekNumber(): Promise<number> {
        const html: string = await this.cabinetRequest.request()
        const $ = cheerio.load(html)
        return this.getWeekNumber($);
    }

    private getUrls(actualWeekNumber: number): Array<string> {
        const lastWeekNumber: number = 16
        const checkWeeks: number = 2

        const firstDayInWeek: number = 1
        const daysInWeek: number = 7

        const baseUrl = `https://cabinet.ztu.edu.ua/site/schedule`
        const urls: Array<string> = []

        for (let week = actualWeekNumber; week <= this.floorTo(actualWeekNumber + checkWeeks - 1, lastWeekNumber); week++) {
            for (let day = firstDayInWeek; day <= daysInWeek; day++) {
                urls.push(`${baseUrl}?week=${week}&day=${day}`)
            }
        }

        return urls;
    }

    private floorTo(value: number, step: number): number {
        if (value <= step) return value
        return Math.floor(value / 16) * 16;
    }


}

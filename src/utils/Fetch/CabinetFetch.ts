import { CabinetRequest } from "../Request/CabinetRequest"
import { WeekDay } from "../../classes/data/WeekDay";
import { Validate } from "../../classes/data/Validate";
import * as cheerio from 'cheerio';

export class CabinetFetch {
    private cabinetRequest: CabinetRequest

    constructor(cabinetRequest: CabinetRequest) {
        this.cabinetRequest = cabinetRequest
    }

    async fetch() {
        const actualWeekNumber: number = await this.getActualWeekNumber();
        const urls: Array<string> = this.getUrls(actualWeekNumber);
        const resultJson = {}

    }

    private async getActualWeekNumber(): Promise<number> {
        const html: string = await this.cabinetRequest.request()
        const $ = cheerio.load(html)
        return parseInt($('.active>a').first().text())
    }

    private getUrls(actualWeekNumber: number): Array<string> {
        const lastWeekNumber: number = 16
        const checkWeeks: number = 2

        const firstDayInWeek: number = 1
        const daysInWeek: number = 7

        const baseUrl = `https://cabinet.ztu.edu.ua/site/schedule`
        const urls: Array<string> = []

        for (let week = actualWeekNumber; week <= this.floorTo(actualWeekNumber + checkWeeks, lastWeekNumber); week++) {
            for (let day = firstDayInWeek; day <= daysInWeek; day++) {
                urls.push(`${baseUrl}?week=${week}&day=${day}`)
            }
        }

        return urls;
    }

    private floorTo(value: number, step: number): number {
        return Math.floor(value / 16) * 16;
    }

}

import * as cheerio from 'cheerio';

import { RozkladValidate } from '../../classes/Validate/RozkladValidate';
import { WeekDay } from '../../classes/type/WeekDay';
import { ScheduleData } from '../../classes/type/ScheduleData';

export class RozkladFetch {
    private getSubject(pair: any): string {
        return pair.find('.subject').text().trim();
    }

    private getTeacher($: any, pair: any): string[] {
        const teachers: string[] = [];

        pair.find('.teacher a').each((_: number, teacher: any) => {
            teachers.push($(teacher).text().trim());
        });

        return teachers;
    }

    private getRoom($: any, pair: any): string[] {
        const rooms: string[] = [];

        pair.find('.room')
            .find('a')
            .each((_: number, room: any) => {
                room = $(room).text().trim()
                room = (String(room).includes('Дист')) ? 'Дистанційно' : room
                rooms.push(room);
            });

        return rooms;
    }

    private getGroup($: any, pair: any): string[] {
        const groups: string[] = [];

        const flowGroups = pair.find('.flow-groups');

        if (flowGroups) {
            flowGroups.find('a').each((_: number, group: any) => {
                groups.push($(group).text().trim());
            });
        } else {
            return ['error'];
        }

        return groups;
    }

    private getSubGroup(pair: any): string {
        const subGroup = pair.find('.subgroup');
        if (subGroup) {
            if (subGroup.text().includes('1')) {
                return '1';
            } else if (subGroup.text().includes('2')) {
                return '2';
            }
        }

        return 'all';
    }

    private getClasses(pair: any): string {
        const regex = '^(Практичне|Лабораторна|Лекція)';
        const activityTagText: string = pair.find('div.activity-tag').text().trim();
        const match: RegExpMatchArray | null = activityTagText.match(regex);
        if (match) {
            return match[0];
        }

        return 'error';
    }

    private createValadate(
        $: any,
        pair: any,
        ordinality: any,
    ) {
        const subject = this.getSubject(pair);
        const teacher = this.getTeacher($, pair);
        const room = this.getRoom($, pair);
        const group = this.getGroup($, pair);
        const subgroup = this.getSubGroup(pair);
        const classes = this.getClasses(pair);

        return new RozkladValidate(
            ordinality,
            subject,
            teacher,
            room,
            group,
            subgroup,
            classes,
        );
    }

    private updateData(
        data: ScheduleData,
        weekName: string,
        dayName: string,
        hour: string,
        validate: RozkladValidate,
    ) {
        if (validate.checkIsValid()) {
            data[weekName] ??= {};
            data[weekName][dayName] ??= {};
            data[weekName][dayName][hour] ??= [];

            data[weekName][dayName][hour].push(validate.toDictionary());
        }
    }

    private checkDayInData(data: ScheduleData, weekName: string) {
        if (!(weekName in data)) {
            data[weekName] = {};
        }
    }

    public async fetch(html: string): Promise<{ [key: string]: any }> {
        const $ = cheerio.load(html);

        const data: ScheduleData = {};
        const selectiveDays: any[] = [];

        const weekDay = new WeekDay()

        $('.wrapper').each((_, wrapper) => {
            const weekName = $(wrapper).find('h2').text().trim();

            $(wrapper)
                .find('tr')
                .each((_, tr) => {
                    const hour = $(tr)
                        .find('th.hour-name>div.full-name')
                        .text()
                        .trim();
                    const ordinality = $(tr)
                        .find('th.hour-name>div.name')
                        .text()
                        .trim();

                    $(tr)
                        .find('td')
                        .each((tdKey, td) => {
                            if ($(td).find("*").length > 0) {
                                this.checkDayInData(
                                    data,
                                    weekName,
                                );

                                const pairs = $(td).find('div.pair');
                                pairs.each((pairKey, pair) => {
                                    const $pair = $(pair);

                                    const dayName = weekDay.stringName(tdKey)

                                    if (pairs.length > 2) {
                                        const dayText = `${weekName}, ${dayName}`
                                        if (!selectiveDays.includes(dayText)) {
                                            selectiveDays.push(dayText)
                                        }
                                    }

                                    if (pair) {
                                        const validate = this.createValadate(
                                            $,
                                            $pair,
                                            ordinality,
                                        );

                                        this.updateData(
                                            data,
                                            weekName,
                                            dayName,
                                            hour,
                                            validate
                                        );
                                    }
                                });
                            }


                        });
                });
        });

        return {
            'data': data,
            'selectiveDays': selectiveDays
        }
    }


}



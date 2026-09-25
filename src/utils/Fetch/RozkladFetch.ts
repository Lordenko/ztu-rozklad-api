import { loadHtml } from './loadHtml';

import { RozkladValidate } from '../../classes/Validate/RozkladValidate';
import { ScheduleData, Lesson } from '../../classes/type/ScheduleData';

export class RozkladFetch {
    private getSubject($: any, pair: any): string {
        const subject = pair.find('.sch-subject').clone();
        subject.find('.sch-subgroup').remove();
        return subject.text().trim();
    }

    private getTeacher($: any, pair: any): string[] {
        const teachers: string[] = [];

        pair.find('.sch-teachers a').each((_: number, teacher: any) => {
            teachers.push($(teacher).text().trim());
        });

        return teachers;
    }

    private getRoom($: any, pair: any): string[] {
        const rooms: string[] = [];

        pair.find('.sch-room a').each((_: number, room: any) => {
            room = $(room).text().trim()
            room = (String(room).includes('Дист')) ? 'Дистанційно' : room
            rooms.push(room);
        });

        return rooms;
    }

    private getGroup($: any, pair: any): string[] {
        const groups: string[] = [];

        pair.find('.sch-flow a').each((_: number, group: any) => {
            groups.push($(group).text().trim());
        });

        return groups;
    }

    private getSubGroup(pair: any): string {
        // .sch-subgroup всередині .sch-subject — підгрупа,
        // .sch-subgroup.sch-flow-no у .sch-meta-line — потік вибіркової дисципліни
        const subGroupText: string = pair.find('.sch-subject .sch-subgroup').text();

        if (subGroupText.includes('1')) {
            return '1';
        } else if (subGroupText.includes('2')) {
            return '2';
        }

        return 'all';
    }

    private getClasses(pair: any): string {
        const regex = '^(Практичне|Лабораторна|Лекція)';
        const kindText: string = pair.find('.sch-kind').text().trim();
        const match: RegExpMatchArray | null = kindText.match(regex);
        if (match) {
            return match[0];
        }

        return 'error';
    }

    private getDayNames($: any, table: any): string[] {
        const dayNames: string[] = [];

        table.find('thead th.sch-day-name').each((_: number, th: any) => {
            const dayName = $(th).clone();
            dayName.children().remove();
            dayNames.push(dayName.text().trim());
        });

        return dayNames;
    }

    private createValadate(
        $: any,
        pair: any,
        ordinality: any,
        selective: boolean,
    ) {
        const subject = this.getSubject($, pair);
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
            selective,
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

            const isDuplicate = data[weekName][dayName][hour].some((lesson: Lesson) => {
                if (lesson.subject !== validate.subject) return false;

                const hasSameTeacher = lesson.teacher.some(t => validate.teacher.includes(t));
                return hasSameTeacher;
            });

            if (!isDuplicate) {
                data[weekName][dayName][hour].push(validate.toDictionary());
            }
        }
    }

    private checkDayInData(data: ScheduleData, weekName: string) {
        if (!(weekName in data)) {
            data[weekName] = {};
        }
    }

    // .sch-days — дубль розкладу для мобільної версії (близько половини сторінки),
    // вирізаємо його до розбору; він тягнеться до кінця тижня (</section>)
    private removeMobileDays(html: string): string {
        return html.replace(/<div class="sch-days">[\s\S]*?<\/section>/g, '</details></section>');
    }

    public async fetch(html: string): Promise<{ [key: string]: any }> {
        const $ = loadHtml(this.removeMobileDays(html));

        const data: ScheduleData = {};
        const selectiveDays: string[] = [];

        // беремо тільки таблицю (.sch-days, якщо лишився, ігноруємо)
        $('section.sch-week').each((_, week) => {
            const weekName = $(week).find('.sch-week-title').text().trim();
            const table = $(week).find('table.sch-table');
            const dayNames = this.getDayNames($, table);

            table.find('tbody tr').each((_, tr) => {
                const hour = $(tr).find('th.sch-hour .sch-hour-time').text().trim();
                const ordinality = $(tr).find('th.sch-hour .sch-hour-num').text().trim();

                $(tr)
                    .find('td.sch-cell')
                    .each((tdKey, td) => {
                        if ($(td).hasClass('is-free')) return;

                        this.checkDayInData(data, weekName);

                        const dayName = dayNames[tdKey];

                        // вибіркові дисципліни явно згруповані в <details class="sch-many">
                        const selective = $(td).find('.sch-many').length > 0;
                        if (selective) {
                            const dayText = `${weekName}, ${dayName}`
                            if (!selectiveDays.includes(dayText)) {
                                selectiveDays.push(dayText)
                            }
                        }

                        $(td)
                            .find('.sch-pair:not(.is-placeholder)')
                            .each((_, pair) => {
                                const validate = this.createValadate(
                                    $,
                                    $(pair),
                                    ordinality,
                                    selective,
                                );

                                this.updateData(
                                    data,
                                    weekName,
                                    dayName,
                                    hour,
                                    validate
                                );
                            });
                    });
            });
        });

        return {
            'data': data,
            'selectiveDays': selectiveDays
        }
    }


}

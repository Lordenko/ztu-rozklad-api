import * as cheerio from 'cheerio';

import { RozkladValidate, RozkladLesson } from '../../classes/Validate/RozkladValidate';
import { ScheduleData, ScheduleResult, Lesson } from '../../classes/type/ScheduleData';

type WeekColumn = {
    name: string;
    date: string;
};

type PairPosition = Pick<RozkladLesson, 'ordinality' | 'weekNumber' | 'date'>;

export class RozkladFetch {
    private readonly remoteRoomName: string = 'Дистанційно';
    private readonly noRoomName: string = 'без ауд.';

    public async fetch(html: string): Promise<ScheduleResult> {
        const $ = cheerio.load(html);

        const data: ScheduleData = {};
        const selectiveDays: string[] = [];

        // Only the table is parsed: `.sch-days` is the same schedule rendered again
        // for narrow screens, so reading both would duplicate every lesson.
        $('section.sch-week').each((_, week) => {
            const $week = $(week);

            const weekNumber = this.getWeekNumber($week);
            const weekName = this.getWeekName($week, weekNumber);

            const table = $week.find('table.sch-table').first();
            if (table.length === 0) return;

            const columns = this.getColumns($, table);

            table.find('tbody > tr').each((_, tr) => {
                const $tr = $(tr);

                const hourCell = $tr.find('th.sch-hour').first();
                const hour = hourCell.find('.sch-hour-time').text().trim();
                const ordinality = hourCell.find('.sch-hour-num').text().trim();
                if (!hour) return;

                $tr.children('td').each((columnIndex, td) => {
                    const column = columns[columnIndex];
                    if (!column) return;

                    const $td = $(td);
                    if ($td.find('.sch-many').length > 0) {
                        this.markSelectiveDay(selectiveDays, weekName, column.name);
                    }

                    this.getPairs($td).each((_, pair) => {
                        const validate = this.createValidate($, $(pair), {
                            ordinality,
                            weekNumber,
                            date: column.date,
                        });

                        this.updateData(data, weekName, column.name, hour, validate);
                    });
                });
            });
        });

        return { data, selectiveDays };
    }

    private getWeekNumber($week: cheerio.Cheerio<any>): string {
        return $week.find('details.sch-fold').first().attr('data-week')?.trim() ?? '';
    }

    private getWeekName($week: cheerio.Cheerio<any>, weekNumber: string): string {
        const title = this.normalize($week.find('.sch-week-title').first().text());
        return title || `Тиждень ${weekNumber}`;
    }

    private getColumns($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): WeekColumn[] {
        return table
            .find('thead th.sch-day-name')
            .map((_, th) => {
                const $th = $(th);

                return {
                    // The header also holds `.sch-date`, `.sch-day-flag` and
                    // `.sch-day-today` badges, so only its own text is the day name.
                    name: this.normalize($th.clone().children().remove().end().text()),
                    date: $th.find('.sch-date').text().trim(),
                };
            })
            .get();
    }

    // A split cell renders the half without a lesson as an empty `.is-placeholder` card.
    private getPairs($td: cheerio.Cheerio<any>): cheerio.Cheerio<any> {
        return $td.find('.sch-pair').not('.is-placeholder');
    }

    private getSubject($pair: cheerio.Cheerio<any>): string {
        // `.sch-subgroup` is rendered inside the subject, drop it before reading the text.
        const subject = $pair
            .find('.sch-subject')
            .first()
            .clone()
            .find('.sch-subgroup')
            .remove()
            .end();

        return this.normalize(subject.text());
    }

    private getTeacher($: cheerio.CheerioAPI, $pair: cheerio.Cheerio<any>): string[] {
        return $pair
            .find('.sch-teachers a')
            .map((_, teacher) => this.normalize($(teacher).text()))
            .get()
            .filter(Boolean);
    }

    private getRoom($: cheerio.CheerioAPI, $pair: cheerio.Cheerio<any>): string[] {
        const $room = $pair.find('.sch-room');

        const rooms = $room
            .find('a')
            .map((_, room) => {
                const name = this.normalize($(room).text());
                return name.includes('Дист') ? this.remoteRoomName : name;
            })
            .get()
            .filter(Boolean);

        if (rooms.length === 0 && $room.find('.sch-noroom').length > 0) {
            return [this.noRoomName];
        }

        return rooms;
    }

    private getEquipment($: cheerio.CheerioAPI, $pair: cheerio.Cheerio<any>): string[] {
        return $pair
            .find('.sch-room i.sch-eq')
            .map((_, equipment) => this.normalize($(equipment).attr('title') ?? ''))
            .get()
            .filter(Boolean);
    }

    private getGroup($: cheerio.CheerioAPI, $pair: cheerio.Cheerio<any>): string[] {
        return $pair
            .find('.sch-flow a')
            .map((_, group) => this.normalize($(group).text()))
            .get()
            .filter(Boolean);
    }

    // Large flows list no group names, only a `потік: N груп` counter.
    private getGroupsCount($pair: cheerio.Cheerio<any>, group: string[]): number {
        if (group.length > 0) return group.length;

        const counter = this.normalize($pair.find('.sch-flow-count').text());
        const match = counter.match(/\d+/);

        return match ? parseInt(match[0], 10) : 0;
    }

    private getSubGroup($pair: cheerio.Cheerio<any>): string {
        const subGroup = $pair.find('.sch-subgroup').first();
        if (subGroup.length === 0) return 'all';

        const match = `${subGroup.attr('title') ?? ''} ${subGroup.text()}`.match(/\d+/);

        return match ? match[0] : 'all';
    }

    private getClasses($pair: cheerio.Cheerio<any>): string {
        return this.normalize($pair.find('.sch-kind').first().text());
    }

    private getPairId($pair: cheerio.Cheerio<any>): string {
        return $pair.attr('data-pair-id')?.trim() ?? '';
    }

    private isSelective($pair: cheerio.Cheerio<any>): boolean {
        return $pair.closest('.sch-many').length > 0;
    }

    private createValidate(
        $: cheerio.CheerioAPI,
        $pair: cheerio.Cheerio<any>,
        position: PairPosition,
    ): RozkladValidate {
        const group = this.getGroup($, $pair);

        return new RozkladValidate({
            ordinality: position.ordinality,
            subject: this.getSubject($pair),
            teacher: this.getTeacher($, $pair),
            room: this.getRoom($, $pair),
            group,
            subgroup: this.getSubGroup($pair),
            classes: this.getClasses($pair),
            date: position.date,
            weekNumber: position.weekNumber,
            pairId: this.getPairId($pair),
            isSelective: this.isSelective($pair),
            groupsCount: this.getGroupsCount($pair, group),
            equipment: this.getEquipment($, $pair),
        });
    }

    private updateData(
        data: ScheduleData,
        weekName: string,
        dayName: string,
        hour: string,
        validate: RozkladValidate,
    ) {
        if (!validate.checkIsValid()) return;

        data[weekName] ??= {};
        data[weekName][dayName] ??= {};
        data[weekName][dayName][hour] ??= [];

        const lessons = data[weekName][dayName][hour];
        if (this.isDuplicate(lessons, validate)) return;

        lessons.push(validate.toDictionary());
    }

    // Subgroup and room belong to the key, otherwise the second subgroup of a split
    // lesson taught by the same teacher would be dropped as a duplicate.
    private isDuplicate(lessons: Lesson[], validate: RozkladValidate): boolean {
        return lessons.some((lesson: Lesson) => {
            if (lesson.pairId && lesson.pairId === validate.pairId) return true;

            if (lesson.subject !== validate.subject) return false;
            if (lesson.subgroup !== validate.subgroup) return false;
            if (!this.isSameList(lesson.room, validate.room)) return false;

            return lesson.teacher.some((teacher) => validate.teacher.includes(teacher));
        });
    }

    private isSameList(left: string[] | undefined, right: string[]): boolean {
        if (!left || left.length !== right.length) return false;
        return left.every((value, index) => value === right[index]);
    }

    private markSelectiveDay(selectiveDays: string[], weekName: string, dayName: string) {
        const dayText = `${weekName}, ${dayName}`;
        if (!selectiveDays.includes(dayText)) selectiveDays.push(dayText);
    }

    private normalize(value: string): string {
        return value.replace(/\s+/g, ' ').trim();
    }
}

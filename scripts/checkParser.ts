import * as cheerio from 'cheerio';

import { RozkladFetch } from '../src/utils/Fetch/RozkladFetch';
import { RozkladRequest } from '../src/utils/Request/RozkladRequest';
import { ScheduleResult } from '../src/classes/type/ScheduleData';

const defaultGroups: number[] = [403, 551, 312, 143, 585, 580];

const weekDays: string[] = [
    'Понеділок',
    'Вівторок',
    'Середа',
    'Четвер',
    'П\'ятниця',
    'Субота',
    'Неділя',
];

type Report = {
    weeks: number;
    days: number;
    lessons: number;
    subgroup: number;
    selective: number;
    selectiveDays: number;
    problems: string[];
};

function checkSchedule(html: string, result: ScheduleResult): Report {
    const $ = cheerio.load(html);

    // The mirrored `.sch-days` list and the empty `.is-placeholder` cards are the
    // two ways this page can inflate a count, so the table is the reference.
    const expected = $('.sch-table .sch-pair').not('.is-placeholder').length;

    const report: Report = {
        weeks: 0,
        days: 0,
        lessons: 0,
        subgroup: 0,
        selective: 0,
        selectiveDays: result.selectiveDays.length,
        problems: [],
    };

    for (const [week, weekData] of Object.entries(result.data)) {
        report.weeks++;

        for (const [day, dayData] of Object.entries(weekData)) {
            report.days++;

            if (!weekDays.includes(day)) {
                report.problems.push(`день "${day}" (тиждень ${week}) не є днем тижня`);
            }

            for (const [hour, lessons] of Object.entries(dayData)) {
                if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(hour)) {
                    report.problems.push(`година "${hour}" (${week}, ${day}) має чужий формат`);
                }

                for (const lesson of lessons) {
                    report.lessons++;

                    if (lesson.subgroup !== 'all') report.subgroup++;
                    if (lesson.isSelective) report.selective++;

                    const place = `${week}, ${day}, ${hour}`;

                    if (!lesson.subject) report.problems.push(`порожній предмет (${place})`);
                    if (!lesson.classes) report.problems.push(`немає типу заняття (${place}): ${lesson.subject}`);
                    if (!lesson.ordinality) report.problems.push(`немає номера пари (${place}): ${lesson.subject}`);
                    if (!lesson.teacher.length) report.problems.push(`немає викладача (${place}): ${lesson.subject}`);
                    if (!lesson.room.length) report.problems.push(`немає аудиторії (${place}): ${lesson.subject}`);

                    if (!['all', '1', '2'].includes(String(lesson.subgroup))) {
                        report.problems.push(`невідома підгрупа "${lesson.subgroup}" (${place})`);
                    }
                }
            }
        }
    }

    if (report.lessons !== expected) {
        const reason = report.lessons > expected ? 'пари продубльовано' : 'пари втрачено';
        report.problems.push(`${reason}: у таблиці ${expected}, розібрано ${report.lessons}`);
    }

    return report;
}

async function main() {
    const groups = process.argv.slice(2).map(Number).filter(Boolean);
    const ids = groups.length > 0 ? groups : defaultGroups;

    let failed = 0;

    for (const id of ids) {
        const html = await new RozkladRequest().request(id);
        const result = await new RozkladFetch().fetch(html);

        const name = cheerio.load(html)('.sch-head h1').text().trim() || '?';
        const report = checkSchedule(html, result);

        console.log(
            `\n${name} (id ${id}): тижнів ${report.weeks}, днів ${report.days}, ` +
            `пар ${report.lessons}, підгрупових ${report.subgroup}, ` +
            `вибіркових ${report.selective}, днів з вибірковими ${report.selectiveDays}`,
        );

        if (report.problems.length === 0) {
            console.log('  ok');
            continue;
        }

        failed++;
        for (const problem of report.problems.slice(0, 10)) console.log(`  [!] ${problem}`);

        const rest = report.problems.length - 10;
        if (rest > 0) console.log(`  [!] ще ${rest} проблем`);
    }

    console.log(`\n${ids.length - failed}/${ids.length} груп без проблем`);
    if (failed > 0) process.exit(1);
}

main();

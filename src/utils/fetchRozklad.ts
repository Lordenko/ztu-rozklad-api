import * as cheerio from 'cheerio'

import { customRequest } from '../utils/request'
import { Validate } from '../classes/data/Validate'
import { WeekDay } from '../classes/data/WeekDay'
import { ScheduleData } from '../classes/type/ScheduleData'

function getSubject(pair: any): string {
    return pair.find('.subject').text().trim()
}

function getTeacher($: any, pair: any): string[] {
    const teachers : string[] = [];

    pair.find('.teacher a').each((_: number, teacher: any) => {
        teachers.push($(teacher).text().trim())
    })

    return teachers
}

function getRoom($: any, pair: any): string[] {
    const rooms: string[] = []

    pair.find('.room').find('a').each((_: number, room: any) => {
        rooms.push($(room).text().trim())
    })

    return rooms
}

function getGroup($: any, pair: any): string[] {
    const groups: string[] = []

    const flowGroups = pair.find('.flow-groups')

    if (flowGroups) {
        flowGroups.find('a').each((_: number, group: any) => {
            groups.push($(group).text().trim())
        })
    } else {
        return ['error']
    }

    return groups
}

function getSubGroup(pair: any): string {
    const subGroup = pair.find('.subgroup')
    if (subGroup) {
        if (subGroup.text().includes('1')) {
            return '1'
        } else if (subGroup.text().includes('2')) {
            return '2' 
        }
    }

    return 'all'
}

function getClasses(pair: any): string {
    const regex = '^(Практичне|Лабораторна|Лекція)'
    const activityTagText : string = pair.find('div.activity-tag').text().trim()
    const match : RegExpMatchArray | null = activityTagText.match(regex)
    if (match) {
        return match[0]
    }

    return 'error'
}

function createValadate($: any, pair: any, day: any, hour: any, index: any, ordinality: any) {
    const subject = getSubject(pair);
    const teacher = getTeacher($, pair);
    const room = getRoom($, pair);
    const group = getGroup($, pair);
    const subgroup = getSubGroup(pair);
    const classes = getClasses(pair);

    // const meet_links = self.__get_meet_links(day, hour, index) if self.__cabinet_auth else ['No success']
    // const other_links = self.__get_other_links(day, hour, index) if self.__cabinet_auth else ['No success']
    // const description = self.__get_description(day, hour, index) if self.__cabinet_auth else 'No success'

    return new Validate(ordinality, subject, teacher, room, group, subgroup, classes) 
}

function updateData(data: ScheduleData, day: string, hour: string, validate: Validate) {
    if (validate.checkIsValid()) {
        if (!data[day]) data[day] = {};
        if (!data[day][hour]) data[day][hour] = [];

        data[day][hour].push(validate.toDictionary());

    }
}

function checkDayInData(data: ScheduleData, day: string) {
    if (!(day in data)) {
        data[day] = {}
    }
}

export async function fetchRozklad(id: number): Promise<any> {
    const html : string = await customRequest(id)

    const $ = cheerio.load(html);

    const data: ScheduleData = {};
    const selectiveSubjects: any[] = []

    $('.wrapper').each((_, wrapper) => {
        const weekNumber = $(wrapper).find('h2').text().trim()
        
        $(wrapper).find('tr').each((_, tr) => {
            const hour = $(tr).find('th.hour-name>div.full-name').text().trim()
            const ordinality = $(tr).find('th.hour-name>div.name').text().trim()

            $(tr).find('td').each((tdKey, td) => {
                checkDayInData(data, new WeekDay(tdKey, weekNumber).stringName())
                
                const pairs = $(td).find('div.pair')
                pairs.each((pairKey, pair) => {
                    const $pair = $(pair)

                    if (($pair.find('*').length > 0)) {
                        if (pairs.length > 2) {
                            
                            if (selectiveSubjects.includes(getSubject($pair))) {
                                return
                            }
                        } 

                        if (pair) {
                            const day = new WeekDay(tdKey, weekNumber).stringName()
                            
                            const validate = createValadate($, $pair, day, hour, pairKey, ordinality)
                            
                            updateData(data, day, hour, validate)
                        }
                    }
                })
            })
        })
    })

    console.log(data);

    return {
        json: data
    }
}
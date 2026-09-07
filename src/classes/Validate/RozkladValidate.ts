import { Lesson } from '../type/ScheduleData';

export type RozkladLesson = {
    ordinality: string;
    subject: string;
    teacher: string[];
    room: string[];
    group: string[];
    subgroup: string;
    classes: string;
    date: string;
    weekNumber: string;
    pairId: string;
    isSelective: boolean;
    groupsCount: number;
    equipment: string[];
};

export class RozkladValidate {
    ordinality: string
    subject: string
    teacher: string[]
    room: string[]
    group: string[]
    subgroup: string
    classes: string
    date: string
    weekNumber: string
    pairId: string
    isSelective: boolean
    groupsCount: number
    equipment: string[]

    constructor(lesson: RozkladLesson) {
        this.ordinality = lesson.ordinality
        this.subject = lesson.subject
        this.teacher = lesson.teacher
        this.room = lesson.room
        this.group = lesson.group
        this.subgroup = lesson.subgroup
        this.classes = lesson.classes
        this.date = lesson.date
        this.weekNumber = lesson.weekNumber
        this.pairId = lesson.pairId
        this.isSelective = lesson.isSelective
        this.groupsCount = lesson.groupsCount
        this.equipment = lesson.equipment
    }

    checkIsValid(): boolean {
        const defined = [
            this.ordinality,
            this.subject,
            this.teacher,
            this.room,
            this.group,
            this.subgroup,
            this.classes,
        ].every((value) => value !== null && value !== undefined);

        return defined && this.subject.length > 0;
    }

    toDictionary(): Lesson {
        return {
            'ordinality': this.ordinality,
            'subject': this.subject,
            'teacher': this.teacher,
            'room': this.room,
            'group': this.group,
            'subgroup': this.subgroup,
            'classes': this.classes,
            'date': this.date,
            'weekNumber': this.weekNumber,
            'pairId': this.pairId,
            'isSelective': this.isSelective,
            'groupsCount': this.groupsCount,
            'equipment': this.equipment
        }
    }
}

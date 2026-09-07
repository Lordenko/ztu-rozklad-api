export type LessonStatus = 'common' | 'super';

export type Lesson = {
    ordinality?: string;
    subject: string;
    teacher: string[];
    room: string[];
    group?: string[];
    subgroup?: string;
    classes?: string;
    date?: string;
    weekNumber?: string;
    pairId?: string;
    isSelective?: boolean;
    groupsCount?: number;
    equipment?: string[];
    description?: string;
    [key: string]: any;
};


export type ScheduleData = {
    [week: string]: {
        [day: string]: {
            [time: string]: Lesson[];
        };
    };
};

export type ScheduleResult = {
    data: ScheduleData;
    selectiveDays: string[];
};

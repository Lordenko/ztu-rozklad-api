export type Lesson = {
    ordinality?: string;
    subject: string;
    teacher: string[];
    room: string[];
    group?: string[];
    subgroup?: string;
    classes?: string;
    [key: string]: any;
};


export type ScheduleData = {
    [week: string]: {
        [day: string]: {
            [time: string]: Lesson[];
        };
    };
};

export class Validate {
    ordinality: string
    subject: string
    teacher: string[]
    room: string[]
    group: string[]
    subgroup: string
    classes: string

    constructor(ordinality: string, subject: string, teacher: string[], room: string[], group: string[], subgroup: string, classes: string) {
        this.ordinality = ordinality
        this.subject = subject
        this.teacher = teacher
        this.room = room
        this.group = group
        this.subgroup = subgroup
        this.classes = classes
    }

    checkIsValid(): boolean {
        return [
            this.ordinality,
            this.subject,
            this.teacher,
            this.room,
            this.group,
            this.subgroup,
            this.classes,
        ].every((value) => value !== null && value !== undefined);
    }

    toDictionary() {
        return {
            'ordinality': this.ordinality,
            'subject': this.subject,
            'teacher': this.teacher,
            'room': this.room,
            'group': this.group,
            'subgroup': this.subgroup,
            'classes': this.classes
        }
    }
}
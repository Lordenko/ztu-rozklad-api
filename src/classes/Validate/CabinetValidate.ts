export class CabinetValidate {
    subject: string
    teacher: string[]
    room: string[]
    description?: string

    constructor(subject: string, teacher: string[], room: string[], description: string | undefined) {
        this.subject = subject
        this.teacher = teacher
        this.room = room
        this.description = description
    }

    checkIsValid(): boolean {
        return [
            this.subject,
            this.teacher,
            this.room,
            this.description,
        ].every((value) => value !== null && value !== undefined);
    }

    toDictionary() {
        return {
            'subject': this.subject,
            'teacher': this.teacher,
            'room': this.room,
            'description': this.description
        }
    }
}
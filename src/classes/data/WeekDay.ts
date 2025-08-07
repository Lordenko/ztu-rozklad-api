export class WeekDay {
    numberDay: number
    numberWeek: string

    constructor(numberDay: number, numberWeek: string) {
        this.numberDay = numberDay
        this.numberWeek = numberWeek
    }

    stringName(): string {
        const nameDay: { [key: number]: string } = {
            0: 'Понеділок',
            1: 'Вівторок',
            2: 'Середа',
            3: 'Четвер',
            4: 'П\'ятниця',
            5: 'Субота',
            6: 'Неділя'
        }

        return `${nameDay[this.numberDay]} ${this.numberWeek}`.toString()
    }
}
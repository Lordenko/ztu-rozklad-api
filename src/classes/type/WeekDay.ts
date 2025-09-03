export class WeekDay {
    stringName(number: number): string {
        const nameDay: { [key: number]: string } = {
            0: 'Понеділок',
            1: 'Вівторок',
            2: 'Середа',
            3: 'Четвер',
            4: 'П\'ятниця',
            5: 'Субота',
            6: 'Неділя'
        }

        return `${nameDay[number]}`.toString()
    }
}
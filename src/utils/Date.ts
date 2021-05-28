import * as Utils from './Utils'
import * as Decoder from './Decoder'

export type Date =
    { year: number, month: Month, day: number }

export function date(year: number, month: number, day: number): Date {
    return {
        year: Math.min(Math.max(1990, Math.floor(year)), 2100),
        month: monthOf(month),
        day: Math.min(Math.max(1, Math.floor(day)), 31),
    }
}

/** This is different to how Javascript's Date defines months */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

function monthOf(number: number): Month {
    return Math.min(Math.max(1, Math.floor(number)), 12) as Month
}

export function toJavascriptDate(date: Date): globalThis.Date {
    return new window.Date(date.year, date.month - 1, date.day)
}

export function fromJavascriptDate(javascriptDate: globalThis.Date): Date {
    return date(
        javascriptDate.getFullYear(),
        1 + javascriptDate.getMonth(),
        javascriptDate.getDate()
    )
}

export function compare(a: Date, b: Date): -1 | 0 | 1 {
    if (a.year < b.year) {
        return -1
    }
    if (a.year === b.year) {
        if (a.month < b.month) {
            return -1
        }
        if (a.month === b.month) {
            return Utils.compareNumbers(a.day, b.day)
        }
        return 1
    }
    return 1
}

export const decoder: Decoder.Decoder<Date> =
    Decoder.map3(
        Decoder.property('year', Decoder.number),
        Decoder.property('month', Decoder.number),
        Decoder.property('day', Decoder.number),
        date
    )

export const monthDecoder: Decoder.Decoder<Month> =
    Decoder.andThen(
        Decoder.number,
        number =>
            number === 1
                || number === 2
                || number === 3
                || number === 4
                || number === 5
                || number === 6
                || number === 7
                || number === 8
                || number === 9
                || number === 10
                || number === 11
                || number === 12
                ? Decoder.succeed(number)
                : Decoder.fail(`Invalid month '${number}'`)
    )

// https://weeknumber.net/how-to/javascript
/** Returns the ISO week of the date. */
export function isoWeek(x: Date): number {
    var date = toJavascriptDate(x);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new window.Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}


export function monthToSpanishLabel(month: Month) {
    switch (month) {
        case 1:
            return "Enero"
        case 2:
            return "Febrero"
        case 3:
            return "Marzo"
        case 4:
            return "Abril"
        case 5:
            return "Mayo"
        case 6:
            return "Junio"
        case 7:
            return "Julio"
        case 8:
            return "Agosto"
        case 9:
            return "Septiembre"
        case 10:
            return "Octubre"
        case 11:
            return "Noviembre"
        case 12:
            return "Diciembre"
    }
}

// --- WEEKDAY

export type Weekday =
    | "Lunes"
    | "Martes"
    | "Miércoles"
    | "Jueves"
    | "Viernes"
    | "Sábado"
    | "Domingo"

export function weekdayToSpanishLabel(weekday: Weekday): string {
    return weekday
}

export function getWeekday(date: Date): Weekday {
    switch (toJavascriptDate(date).getDay()) {
        case 0: return "Domingo"
        case 1: return "Lunes"
        case 2: return "Martes"
        case 3: return "Miércoles"
        case 4: return "Jueves"
        case 5: return "Viernes"
        default: return "Sábado"
    }
}


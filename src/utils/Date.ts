import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Decoder from './decoder/Decoder'

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
type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

function monthOf(number: number): Month {
    return Math.min(Math.max(1, Math.floor(number)), 12) as Month
}

export function toJavascriptDate(date: Date): globalThis.Date {
    return new window.Date(date.year, date.month - 1, date.day)
}

// --- GROUP

/** A group expresses the relationship between today and some other date
 * in a human-comprehensible way:
 * "This week", "Last week", (x + " weeks ago"), "Last month", and so on.
 */
export type Group =
    | { tag: "year", year: number }
    | { tag: "lastYear" }
    | { tag: "month", month: Month }
    | { tag: "lastMonth" }
    | { tag: "weeksAgo", x: 2 | 3 | 4 }
    | { tag: "lastWeek" }
    | { tag: "thisWeek" }
    | { tag: "nextWeek" }
    | { tag: "inTheFuture" }

export function groupToSpanishLabel(group: Group): string {
    switch (group.tag) {
        case "inTheFuture":
            return "En el futuro"
        case "nextWeek":
            return "La semana que viene"
        case "thisWeek":
            return "Esta semana"
        case "lastWeek":
            return "La semana pasada"
        case "weeksAgo":
            return `Hace ${group.x} semanas`
        case "lastMonth":
            return "El mes pasado"
        case "month":
            return monthToSpanishLabel(group.month)
        case "lastYear":
            return "El año pasado"
        case "year":
            return String(group.year)
        default:
            const _: never = group
            return "Nunca"
    }
}

function monthToSpanishLabel(month: Month) {
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

export function groupOf(args: { today: Date, time: Date }): Group {
    const { today, time } = args

    if (time.year > today.year) {
        return { tag: "inTheFuture" }
    } else if (time.year === today.year) {
        return groupSameYear(today, time)
    } else if (time.year === today.year - 1) {
        return { tag: "lastYear" }
    } else {
        return { tag: "year", year: time.year }
    }
}

function groupSameYear(today: Date, time: Date): Group {
    if (time.month > today.month) {
        if (isoWeek(time) === isoWeek(today) + 1) {
            return { tag: "nextWeek" }
        } else {
            return { tag: "inTheFuture" }
        }
    } else if (time.month === today.month) {
        if (isoWeek(time) === isoWeek(today) + 1) {
            return { tag: "nextWeek" }
        } else if (isoWeek(time) === isoWeek(today)) {
            return { tag: "thisWeek" }
        } else if (isoWeek(time) === isoWeek(today) - 1) {
            return { tag: "lastWeek" }
        } else {
            return {
                tag: "weeksAgo",
                x: isoWeek(today) - isoWeek(time) as 2 | 3 | 4
            }
        }
    } else if (time.month === today.month - 1) {
        return { tag: "lastMonth" }
    } else {
        return {
            tag: "month",
            month: time.month
        }
    }
}

// https://weeknumber.net/how-to/javascript
// Returns the ISO week of the date.
function isoWeek(x: Date): number {
    var date = toJavascriptDate(x);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new window.Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
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

function weekdayFromDate(date: Date): Weekday {
    switch (toJavascriptDate(date).getDay()) {
        case 0: return "Domingo" as Weekday
        case 1: return "Lunes" as Weekday
        case 2: return "Martes" as Weekday
        case 3: return "Miércoles" as Weekday
        case 4: return "Jueves" as Weekday
        case 5: return "Viernes" as Weekday
        default: return "Sábado" as Weekday
    }
}


// --- DAY TAG


export type DayTag =
    | { tag: "distantDate", weekday: Weekday, day: number, month: Month, year: number }
    | { tag: "thisYearsDate", weekday: Weekday, day: number, month: Month }
    | { tag: "earlierThisWeek", weekday: Weekday }
    | { tag: "yesterday" }
    | { tag: "today" }
    | { tag: "tomorrow" }


export function dayTag(args: { today: Date, time: Date }): DayTag {
    const { today, time } = args

    if (time.year !== today.year) {
        return {
            tag: "distantDate",
            weekday: weekdayFromDate(time),
            day: time.day,
            month: time.month,
            year: time.year,
        }
    } else if (time.month === today.month) {
        if (time.day === today.day - 1) {
            return { tag: "yesterday" }
        } else if (time.day === today.day) {
            return { tag: "today" }
        } else if (time.day === today.day + 1) {
            return { tag: "tomorrow" }
        } else if (time.day < today.day && isoWeek(time) === isoWeek(today)) {
            return { tag: "earlierThisWeek", weekday: weekdayFromDate(time) }
        } else {
            return {
                tag: "thisYearsDate",
                weekday: weekdayFromDate(time),
                day: time.day,
                month: time.month,
            }
        }
    } else {
        return {
            tag: "thisYearsDate",
            weekday: weekdayFromDate(time),
            day: time.day,
            month: time.month,
        }
    }
}

export function dayTagToSpanishLabel(day: DayTag): string {
    switch (day.tag) {
        case "distantDate":
            return `${weekdayToSpanishLabel(day.weekday)} ${day.day} de `
                + `${monthToSpanishLabel(day.month)}, ${day.year}`
        case "thisYearsDate":
            return `${weekdayToSpanishLabel(day.weekday)} ${day.day} de `
                + `${monthToSpanishLabel(day.month)}`
        case "earlierThisWeek":
            return weekdayToSpanishLabel(day.weekday)
        case "today":
            return "Hoy"
        case "tomorrow":
            return "Mañana"
        case "yesterday":
            return "Ayer"
    }
}

export const decoder: Decoder.Decoder<Date> =
    Decoder.map3(
        Decoder.property('year', Decoder.number),
        Decoder.property('month', Decoder.number),
        Decoder.property('day', Decoder.number),
        date
    )

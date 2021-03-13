import * as Maybe from '../utils/Maybe'
import * as Utils from '../utils/Utils'

// --- MONTH

export type Month =
    | "Enero"
    | "Febrero"
    | "Marzo"
    | "Abril"
    | "Mayo"
    | "Junio"
    | "Julio"
    | "Agosto"
    | "Septiembre"
    | "Octubre"
    | "Noviembre"
    | "Diciembre"

export function monthToSpanishLabel(month: Month): string {
    return month
}

function monthFromDate(date: Date): Month {
    switch (date.getMonth()) {
        case 0: return "Enero" as Month
        case 1: return "Febrero" as Month
        case 2: return "Marzo" as Month
        case 3: return "Abril" as Month
        case 4: return "Mayo" as Month
        case 5: return "Junio" as Month
        case 6: return "Julio" as Month
        case 7: return "Agosto" as Month
        case 8: return "Septiembre" as Month
        case 9: return "Octubre" as Month
        case 10: return "Noviembre" as Month
        default: return "Diciembre" as Month
    }
}


// --- GROUP

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
            return _
    }
}

export function group(args: { today: Date, time: Date }): Group {
    const { today, time } = args

    if (time.getFullYear() > today.getFullYear()) {
        return { tag: "inTheFuture" }
    } else if (time.getFullYear() === today.getFullYear()) {
        return groupSameYear(today, time)
    } else if (time.getFullYear() === today.getFullYear() - 1) {
        return { tag: "lastYear" }
    } else {
        return { tag: "year", year: time.getFullYear() }
    }
}

function groupSameYear(today: Date, time: Date): Group {
    if (time.getMonth() > today.getMonth()) {
        if (isoWeek(time) === isoWeek(today) + 1) {
            return { tag: "nextWeek" }
        } else {
            return { tag: "inTheFuture" }
        }
    } else if (time.getMonth() === today.getMonth()) {
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
    } else if (time.getMonth() === today.getMonth() - 1) {
        return { tag: "lastMonth" }
    } else {
        return {
            tag: "month",
            month: monthFromDate(time)
        }
    }
}

// https://weeknumber.net/how-to/javascript
// Returns the ISO week of the date.
function isoWeek(x: Date): number {
    var date = new Date(x.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
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
    switch (date.getDay()) {
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
    | { tag: "distantDate", weekday: Weekday, date: number, month: Month, year: number }
    | { tag: "thisYearsDate", weekday: Weekday, date: number, month: Month }
    | { tag: "earlierThisWeek", weekday: Weekday }
    | { tag: "yesterday" }
    | { tag: "today" }
    | { tag: "tomorrow" }


export function dayTag(args: { today: Date, time: Date }): DayTag {
    const { today, time } = args

    if (time.getFullYear() !== today.getFullYear()) {
        return {
            tag: "distantDate",
            weekday: weekdayFromDate(time),
            date: time.getDate(),
            month: monthFromDate(time),
            year: time.getFullYear(),
        }
    } else if (time.getMonth() === today.getMonth()) {
        if (time.getDay() === today.getDay() - 1) {
            return { tag: "yesterday" }
        } else if (time.getDay() === today.getDay()) {
            return { tag: "today" }
        } else if (time.getDay() === today.getDay() + 1) {
            return { tag: "tomorrow" }
        } else if (time.getDay() < today.getDay() && isoWeek(time) === isoWeek(today)) {
            return { tag: "earlierThisWeek", weekday: weekdayFromDate(time) }
        } else {
            return {
                tag: "thisYearsDate",
                weekday: weekdayFromDate(time),
                date: time.getDate(),
                month: monthFromDate(time),
            }
        }
    } else {
        return {
            tag: "thisYearsDate",
            weekday: weekdayFromDate(time),
            date: time.getDate(),
            month: monthFromDate(time),
        }
    }
}

export function dayTagToSpanishLabel(day: DayTag): string {
    switch (day.tag) {
        case "distantDate":
            return `${weekdayToSpanishLabel(day.weekday)} ${day.date} de `
                + `${monthToSpanishLabel(day.month)}, ${day.year}`
        case "thisYearsDate":
            return `${weekdayToSpanishLabel(day.weekday)} ${day.date} de `
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

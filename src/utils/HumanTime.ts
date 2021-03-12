import * as Maybe from '../utils/Maybe'

/**
 * Human-readable time groups relative to the present.
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

export type Weekday =
    | "Lunes"
    | "Martes"
    | "Miércoles"
    | "Jueves"
    | "Viernes"
    | "Sábado"
    | "Domingo"

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

export function group(args: { now: Date, time: Date }): Group {
    const { now, time } = args

    if (time.getFullYear() > now.getFullYear()) {
        return { tag: "inTheFuture" }
    } else if (time.getFullYear() === now.getFullYear()) {
        return groupSameYear(now, time)
    } else if (time.getFullYear() === now.getFullYear() - 1) {
        return { tag: "lastYear" }
    } else {
        return { tag: "year", year: time.getFullYear() }
    }
}

export function groupEquals(a: Group, b: Group): boolean {
    if (a.tag === "year" && b.tag === "year") {
        return a.year === b.year
    } else if (a.tag === "month" && b.tag === "month") {
        return a.month === b.month
    } else if (a.tag === "weeksAgo" && b.tag === "weeksAgo") {
        return a.x === b.x
    } else {
        return a.tag === b.tag
    }
}

function groupSameYear(now: Date, time: Date): Group {
    if (time.getMonth() > now.getMonth()) {
        if (isoWeek(time) === isoWeek(now) + 1) {
            return { tag: "nextWeek" }
        } else {
            return { tag: "inTheFuture" }
        }
    } else if (time.getMonth() === now.getMonth()) {
        if (isoWeek(time) === isoWeek(now) + 1) {
            return { tag: "nextWeek" }
        } else if (isoWeek(time) === isoWeek(now)) {
            return { tag: "thisWeek" }
        } else if (isoWeek(time) === isoWeek(now) - 1) {
            return { tag: "lastWeek" }
        } else {
            return {
                tag: "weeksAgo",
                x: isoWeek(now) - isoWeek(time) as 2 | 3 | 4
            }
        }
    } else if (time.getMonth() === now.getMonth() - 1) {
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

/** Tag a day in a human-readable way */
export type DayTag =
    | { tag: "distantDate", weekday: Weekday, date: number, month: Month, year: number }
    | { tag: "thisYearsDate", weekday: Weekday, date: number, month: Month }
    | { tag: "earlierThisWeek", weekday: Weekday }
    | { tag: "yesterday" }
    | { tag: "today" }
    | { tag: "tomorrow" }

export function tagDay(args: { now: Date, time: Date }): DayTag {
    const { now, time } = args

    if (time.getFullYear() !== now.getFullYear()) {
        return {
            tag: "distantDate",
            weekday: weekdayFromDate(time),
            date: time.getDate(),
            month: monthFromDate(time),
            year: time.getFullYear(),
        }
    } else if (time.getMonth() === now.getMonth()) {
        if (time.getDay() === now.getDay() - 1) {
            return { tag: "yesterday" }
        } else if (time.getDay() === now.getDay()) {
            return { tag: "today" }
        } else if (time.getDay() === now.getDay() + 1) {
            return { tag: "tomorrow" }
        } else if (time.getDay() < now.getDay() && isoWeek(time) === isoWeek(now)) {
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

import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Decoder from './utils/Decoder'
import * as Date from './utils/Date'

// --- GROUP

/** A group expresses the relationship between today and some other date
 * in a human-comprehensible way:
 * "This week", "Last week", (x + " weeks ago"), "Last month", and so on.
 */
 export type ByAge =
    | { groupTag: "year", year: number }
    | { groupTag: "lastYear" }
    | { groupTag: "month", month: Date.Month }
    | { groupTag: "lastMonth" }
    | { groupTag: "weeksAgo", x: 2 | 3 | 4 }
    | { groupTag: "lastWeek" }
    | { groupTag: "thisWeek" }
    | { groupTag: "nextWeek" }
    | { groupTag: "inTheFuture" }

function of(group: ByAge): ByAge {
    return group;
}

export const decoder: Decoder.Decoder<ByAge> =
    Decoder.andThen(
        Decoder.property("groupTag", Decoder.string),
        groupTag => {
            switch (groupTag) {
                case "inTheFuture":
                case "nextWeek":
                case "thisWeek":
                case "lastWeek":
                case "lastYear":
                case "lastMonth":
                    return Decoder.succeed(of({ groupTag }))
                case "year":
                    return Decoder.map(
                        Decoder.property("year", Decoder.number),
                        year => of({ groupTag, year })
                    )
                case "month":
                    return Decoder.map(
                        Decoder.property("month", Date.monthDecoder),
                        month => of({ groupTag, month })
                    )
                case "weeksAgo":
                    return Decoder.andThen(
                        Decoder.property("x", Decoder.number),
                        x =>
                            x === 2 || x === 3 || x === 4
                                ? Decoder.succeed(of({ groupTag, x }))
                                : Decoder.fail(`Invalid weeksAgo ${x}`)
                    )
                default:
                    return Decoder.fail(`Unknown group tag '${groupTag}'`)
            }
        }
    )

export function toSpanishLabel(group: ByAge): string {
    switch (group.groupTag) {
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

export function toStringId(group: ByAge): string {
 switch (group.groupTag) {
     case "inTheFuture":
         return "inTheFuture"
     case "nextWeek":
         return "nextWeek"
     case "thisWeek":
         return "thisWeek"
     case "lastWeek":
         return "lastWeek"
     case "weeksAgo":
         return `weeksAgo-${group.x}`
     case "lastMonth":
         return "lastMonth"
     case "month":
         return `month-${group.month}`
     case "lastYear":
         return "lastYear"
     case "year":
         return `year-${String(group.year)}`
     default:
         const _: never = group
         return "never"
 }
}

function monthToSpanishLabel(month: Date.Month) {
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

export function byAge(args: { today: Date.Date, time: Date.Date }): ByAge {
 const { today, time } = args

 if (time.year > today.year) {
     return { groupTag: "inTheFuture" }
 } else if (time.year === today.year) {
     return groupSameYear(today, time)
 } else if (time.year === today.year - 1) {
     return { groupTag: "lastYear" }
 } else {
     return { groupTag: "year", year: time.year }
 }
}

// https://weeknumber.net/how-to/javascript
// Returns the ISO week of the date.
function isoWeek(x: Date.Date): number {
    var date = Date.toJavascriptDate(x);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new window.Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

function groupSameYear(today: Date.Date, time: Date.Date): ByAge {
 if (time.month > today.month) {
     if (isoWeek(time) === isoWeek(today) + 1) {
         return { groupTag: "nextWeek" }
     } else {
         return { groupTag: "inTheFuture" }
     }
 } else if (time.month === today.month) {
     if (isoWeek(time) === isoWeek(today) + 1) {
         return { groupTag: "nextWeek" }
     } else if (isoWeek(time) === isoWeek(today)) {
         return { groupTag: "thisWeek" }
     } else if (isoWeek(time) === isoWeek(today) - 1) {
         return { groupTag: "lastWeek" }
     } else {
         return {
             groupTag: "weeksAgo",
             x: isoWeek(today) - isoWeek(time) as 2 | 3 | 4
         }
     }
 } else if (time.month === today.month - 1) {
     return { groupTag: "lastMonth" }
 } else {
     return {
         groupTag: "month",
         month: time.month
     }
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

function weekdayFromDate(date: Date.Date): Weekday {
    switch (Date.toJavascriptDate(date).getDay()) {
        case 0: return "Domingo"
        case 1: return "Lunes"
        case 2: return "Martes"
        case 3: return "Miércoles"
        case 4: return "Jueves"
        case 5: return "Viernes"
        default: return "Sábado"
    }
}


// --- DAY TAG


export type ByDate =
    | { dayTag: "distantDate", weekday: Weekday, day: number, month: Date.Month, year: number }
    | { dayTag: "thisYearsDate", weekday: Weekday, day: number, month: Date.Month }
    | { dayTag: "earlierThisWeek", weekday: Weekday }
    | { dayTag: "yesterday" }
    | { dayTag: "today" }
    | { dayTag: "tomorrow" }


export function byDate(args: { today: Date.Date, time: Date.Date }): ByDate {
    const { today, time } = args

    if (time.year !== today.year) {
        return {
            dayTag: "distantDate",
            weekday: weekdayFromDate(time),
            day: time.day,
            month: time.month,
            year: time.year,
        }
    } else if (time.month === today.month) {
        if (time.day === today.day - 1) {
            return { dayTag: "yesterday" }
        } else if (time.day === today.day) {
            return { dayTag: "today" }
        } else if (time.day === today.day + 1) {
            return { dayTag: "tomorrow" }
        } else if (time.day < today.day && isoWeek(time) === isoWeek(today)) {
            return { dayTag: "earlierThisWeek", weekday: weekdayFromDate(time) }
        } else {
            return {
                dayTag: "thisYearsDate",
                weekday: weekdayFromDate(time),
                day: time.day,
                month: time.month,
            }
        }
    } else {
        return {
            dayTag: "thisYearsDate",
            weekday: weekdayFromDate(time),
            day: time.day,
            month: time.month,
        }
    }
}

export function byDateToSpanishLabel(day: ByDate): string {
    switch (day.dayTag) {
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

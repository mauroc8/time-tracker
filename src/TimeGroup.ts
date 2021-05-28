
import * as Date from './utils/Date'
import * as Record from './Record'
import * as Array_ from './utils/Array'
import * as Utils from './utils/Utils'

// --- TIME GROUP

/** Un TimeGroup es un arreglo de `Record`s de un mismo día, ordenados
 * por su tiempo de inicio.
*/
export type TimeGroup = {
    kind: "TimeGroup",
    tag: Tag,
    records: [Record.Record, ...Array<Record.Record>],
}

function timeGroupOf(
    records: [Record.Record, ...Array<Record.Record>],
    today: Date.Date
): TimeGroup {
    return {
        kind: "TimeGroup",
        tag: fromDate({ today, time: records[0].date }),
        records,
    }
}

export function fromRecords(
    records: [Record.Record, ...Array<Record.Record>],
    today: Date.Date
): [TimeGroup, ...Array<TimeGroup>] {
    const timeGroups = Array_.groupWhile(
        records,
        (a, b) =>
        Utils.equals(
            fromDate({ today, time: a.date }),
            fromDate({ today, time: b.date })
        ),
    )
        .map(records_ => timeGroupOf(records_, today))

    // Como `records` es un arreglo no-vacío, `groupWhile` va a devolver
    // un arreglo no-vacío.

    if (timeGroups[0] === undefined) {
        throw "error: Array_.groupWhile should have returned a nonempty array since its input was a nonempty array"
    }

    return timeGroups as [TimeGroup, ...Array<TimeGroup>]
}

// --- TAG


export type Tag =
    | { dayTag: "distantDate", weekday: Date.Weekday, day: number, month: Date.Month, year: number }
    | { dayTag: "thisYearsDate", weekday: Date.Weekday, day: number, month: Date.Month }
    | { dayTag: "earlierThisWeek", weekday: Date.Weekday }
    | { dayTag: "yesterday" }
    | { dayTag: "today" }
    | { dayTag: "tomorrow" }


export function fromDate(args: { today: Date.Date, time: Date.Date }): Tag {
    const { today, time } = args

    if (time.year !== today.year) {
        return {
            dayTag: "distantDate",
            weekday: Date.getWeekday(time),
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
        } else if (time.day < today.day && Date.isoWeek(time) === Date.isoWeek(today)) {
            return { dayTag: "earlierThisWeek", weekday: Date.getWeekday(time) }
        } else {
            return {
                dayTag: "thisYearsDate",
                weekday: Date.getWeekday(time),
                day: time.day,
                month: time.month,
            }
        }
    } else {
        return {
            dayTag: "thisYearsDate",
            weekday: Date.getWeekday(time),
            day: time.day,
            month: time.month,
        }
    }
}

export function toSpanishLabel(day: Tag): string {
    switch (day.dayTag) {
        case "distantDate":
            return `${Date.weekdayToSpanishLabel(day.weekday)} ${day.day} de `
                + `${Date.monthToSpanishLabel(day.month)}, ${day.year}`
        case "thisYearsDate":
            return `${Date.weekdayToSpanishLabel(day.weekday)} ${day.day} de `
                + `${Date.monthToSpanishLabel(day.month)}`
        case "earlierThisWeek":
            return Date.weekdayToSpanishLabel(day.weekday)
        case "today":
            return "Hoy"
        case "tomorrow":
            return "Mañana"
        case "yesterday":
            return "Ayer"
    }
}

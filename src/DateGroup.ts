import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Decoder from './utils/Decoder'
import * as Date from './utils/Date'
import * as TimeGroup from './TimeGroup'
import * as Record from './Record'
import * as Array_ from './utils/Array'
import './DateGroup.css'

export type DateGroup = {
    kind: "DateGroup",
    tag: Tag,
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]]
}

function dateGroupOf(
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]],
    today: Date.Date
): DateGroup {
    return {
        kind: "DateGroup",
        tag: fromDate({ today, time: days[0].records[0].date }),
        days,
    }
}

/** Toma un arreglo de `Record`, lo ordena, y clasifica sus elementos
 * según su TimeGroup y según su DateGroup.
*/
export function fromRecords(
    records: Array<Record.Record>,
    today: Date.Date
): Array<DateGroup> {
    return Array_.groupWhile(
        records
            .sort(Record.compare)
            .reverse(),
        (a, b) => 
            Utils.equals(
                fromDate({ today, time: a.date }),
                fromDate({ today, time: b.date })
            )
    )
        .map(recordsInGroup =>
            dateGroupOf(
                TimeGroup.fromRecords(recordsInGroup, today),
                today
            )
        )
}

// --- GROUP TAG

/** A DateGroup.Tag expresses the relationship between today and some other date
 * in a human-comprehensible way:
 * "This week", "Last week", "2 weeks ago", "Last month", and so on.
 */
 export type Tag =
    | { groupTag: "year", year: number }
    | { groupTag: "lastYear" }
    | { groupTag: "month", month: Date.Month }
    | { groupTag: "lastMonth" }
    | { groupTag: "weeksAgo", x: 2 | 3 | 4 }
    | { groupTag: "lastWeek" }
    | { groupTag: "thisWeek" }
    | { groupTag: "nextWeek" }
    | { groupTag: "inTheFuture" }

function of(group: Tag): Tag {
    return group;
}

export const decoder: Decoder.Decoder<Tag> =
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

export function toSpanishLabel(group: Tag): string {
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
            return Date.monthToSpanishLabel(group.month)
        case "lastYear":
            return "El año pasado"
        case "year":
            return String(group.year)
        default:
            const _: never = group
            return "Nunca"
    }
}

export function toStringId(group: Tag): string {
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

export function fromDate(args: { today: Date.Date, time: Date.Date }): Tag {
 const { today, time } = args

 if (time.year > today.year) {
     return { groupTag: "inTheFuture" }
 } else if (time.year === today.year) {
    if (time.month > today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: "nextWeek" }
        } else {
            return { groupTag: "inTheFuture" }
        }
    } else if (time.month === today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: "nextWeek" }
        } else if (Date.isoWeek(time) === Date.isoWeek(today)) {
            return { groupTag: "thisWeek" }
        } else if (Date.isoWeek(time) === Date.isoWeek(today) - 1) {
            return { groupTag: "lastWeek" }
        } else {
            return {
                groupTag: "weeksAgo",
                x: Date.isoWeek(today) - Date.isoWeek(time) as 2 | 3 | 4
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
 } else if (time.year === today.year - 1) {
     return { groupTag: "lastYear" }
 } else {
     return { groupTag: "year", year: time.year }
 }
}

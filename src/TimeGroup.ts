
import * as Date from './utils/Date'
import * as Record from './Record'
import * as NonemptyArray from './utils/NonemptyArray'
import * as Utils from './utils/Utils'
import * as Layout from './layout/Layout'
import * as Html from './vdom/Html'
import * as Color from './style/Color'
import { pair } from './utils/Pair'

// --- TIME GROUP

/** Un TimeGroup es un arreglo de `Record`s de un mismo día, ordenados
 * por su tiempo de inicio.
*/
export type TimeGroup = {
    kind: 'TimeGroup',
    tag: Tag,
    records: NonemptyArray.NonemptyArray<Record.Record>,
}

function timeGroupOf(
    records: NonemptyArray.NonemptyArray<Record.Record>,
    today: Date.Date
): TimeGroup {
    return {
        kind: 'TimeGroup',
        tag: fromDate({ today, time: records[0].date }),
        records,
    }
}

export function fromRecords(
    records: NonemptyArray.NonemptyArray<Record.Record>,
    today: Date.Date
): NonemptyArray.NonemptyArray<TimeGroup> {
    return NonemptyArray.map(
        NonemptyArray.groupWhile(
            records,
            (a, b) =>
            Utils.equals(
                fromDate({ today, time: a.date }),
                fromDate({ today, time: b.date })
            ),
        ),
        records_ => timeGroupOf(records_, today)
    )
}


// --- TAG


export type Tag =
    | { dayTag: 'distantDate', weekday: Date.Weekday, day: number, month: Date.Month, year: number }
    | { dayTag: 'thisYearsDate', weekday: Date.Weekday, day: number, month: Date.Month }
    | { dayTag: 'earlierThisWeek', weekday: Date.Weekday }
    | { dayTag: 'yesterday' }
    | { dayTag: 'today' }
    | { dayTag: 'tomorrow' }


export function fromDate(args: { today: Date.Date, time: Date.Date }): Tag {
    const { today, time } = args

    if (time.year !== today.year) {
        return {
            dayTag: 'distantDate',
            weekday: Date.getWeekday(time),
            day: time.day,
            month: time.month,
            year: time.year,
        }
    } else if (time.month === today.month) {
        if (time.day === today.day - 1) {
            return { dayTag: 'yesterday' }
        } else if (time.day === today.day) {
            return { dayTag: 'today' }
        } else if (time.day === today.day + 1) {
            return { dayTag: 'tomorrow' }
        } else if (time.day < today.day && Date.isoWeek(time) === Date.isoWeek(today)) {
            return { dayTag: 'earlierThisWeek', weekday: Date.getWeekday(time) }
        } else {
            return {
                dayTag: 'thisYearsDate',
                weekday: Date.getWeekday(time),
                day: time.day,
                month: time.month,
            }
        }
    } else {
        return {
            dayTag: 'thisYearsDate',
            weekday: Date.getWeekday(time),
            day: time.day,
            month: time.month,
        }
    }
}

export function toSpanishLabel(day: Tag): string {
    switch (day.dayTag) {
        case 'distantDate':
            return `${Date.weekdayToSpanishLabel(day.weekday)} ${day.day} de ${Date.monthToSpanishLabel(day.month)}, ${day.year}`
        case 'thisYearsDate':
            return `${Date.weekdayToSpanishLabel(day.weekday)} ${day.day} de ${Date.monthToSpanishLabel(day.month)}`
        case 'earlierThisWeek':
            return Date.weekdayToSpanishLabel(day.weekday)
        case 'today':
            return 'Hoy'
        case 'tomorrow':
            return 'Mañana'
        case 'yesterday':
            return 'Ayer'
    }
}

// --- VIEW

export function view<E, C>(
    tag: Tag,
    records: Array<Record.Record>,
    options: {
        onChange: (id: Record.Id, input: Record.InputName, value: string) => E,
        onInput: (id: Record.Id, input: Record.InputName, value: string) => E,
        onPlay: (id: Record.Id) => E,
        onDelete: (id: Record.Id) => E,
    }
): Layout.Layout<E, C> {
    return Layout.column(
        'div',
        [
            Layout.spacing(30),
        ],
        [
            Layout.column(
                'div',
                [
                    Layout.color(Color.accent),
                    Html.style('font-size', '12px'),
                    Html.style('letter-spacing', '0.15em'),
                    Layout.paddingXY(8, 0),
                ],
                [
                    Layout.inlineText(toSpanishLabel(tag).toUpperCase()),
                ]
            ),
            Layout.keyed(
                'column',
                'div',
                [
                    Layout.spacing(50),
                ],
                records.map(record =>
                    pair(
                        String(record.id.id),
                        Record.view(
                            record,
                            {
                                onChange: (onInput, value) => options.onChange(record.id, onInput, value),
                                onInput: (onInput, value) => options.onInput(record.id, onInput, value),
                                onPlay: options.onPlay(record.id),
                                onDelete: options.onDelete(record.id),
                            }
                        )
                    )
                )
            )
        ]
    )
}

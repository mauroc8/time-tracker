
import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Update from './Update'
import * as Levenshtein from './utils/Levenshtein'
import * as Layout from './layout/Layout'
import * as Component from './style/Component'
import * as Html from './vdom/Html'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Decoder from './utils/Decoder'
import * as Time from './utils/Time'
import * as Date from './utils/Date'

export type Id = {
    tag: "recordId",
    id: number,
}

export function id(id: number): Id {
    return { tag: "recordId", id }
}

// RECORD ---


export type Record = {
    id: Id,
    description: string,
    taskInput: string,
    startInput: string,
    startTime: Time.Time,
    endInput: string,
    endTime: Time.Time,
    date: Date.Date
}

export function record(
    id: Id,
    description: string,
    taskInput: string,
    start: Time.Time,
    end: Time.Time,
    date: Date.Date
): Record {
    return {
        id,
        description,
        startInput: Time.toString(start),
        startTime: start,
        endInput: Time.toString(end),
        endTime: end,
        taskInput,
        date,
    }
}

export function hasId(id: Id, record: Record): boolean {
    return Utils.equals(id, record.id)
}

export function withDescription(description: string, record: Record): Record {
    return { ...record, description }
}

export function withTask(taskInput: string, record: Record): Record {
    return { ...record, taskInput }
}

export function withStart(startInput: string, record: Record): Record {
    return {
        ...record,
        startInput,
        startTime: Time.fromString(startInput).withDefault(record.startTime)
    }
}

export function withEnd(endInput: string, record: Record): Record {
    return {
        ...record,
        endInput,
        endTime: Time.fromString(endInput).withDefault(record.endTime)
    }
}

export function compare(a: Record, b: Record): -1 | 0 | 1 {
    const dateComparison = Date.compare(a.date, b.date)

    if (dateComparison == 0) {
        return Time.compare(a.startTime, b.startTime)
    }

    return dateComparison
}

/** If a date is mispelled or the task is invalid, reset the input value to the last valid value. */
export function save(record: Record, today: Date.Date): Record {
    return {
        id: record.id,
        description: record.description,
        ...Time.fromString(record.startInput)
            .map(startTime => ({ startTime, startInput: record.startInput }))
            .withDefault({ startTime: record.startTime, startInput: Time.toString(record.startTime) }),
        ...Time.fromString(record.endInput)
            .map(endTime => ({ endTime, endInput: record.endInput }))
            .withDefault({ endTime: record.endTime, endInput: Time.toString(record.endTime) }),
        taskInput: record.taskInput,
        date: today,
    }
}

export function view<A>(record: Record): Layout.Layout<A> {

    const separator = Layout.column<A>(
        'div',
        [
            Html.style("flex-basis", "2%"),
        ],
        []
    )

    return Layout.row(
        "div",
        [
            Html.attribute("class", "record"),
        ],
        [
            Component.textInput(
                [
                    Html.style("flex-basis", "40%"),
                ],
                {
                    id: `record_${record.id.id}_description`,
                    label: Layout.column(
                        "div",
                        [Html.paddingXY(8, 0)],
                        [Layout.text('Descripción')]
                    ),
                    value: record.description,
                    attributes: [],
                }
            ),
            separator,
            Component.textInput(
                [
                    Html.style("flex-basis", "20%"),
                ],
                {
                    id: `record_${record.id.id}_task`,
                    label: Layout.column(
                        "div",
                        [Html.paddingXY(8, 0)],
                        [Layout.text('Tarea')]
                    ),
                    value: record.taskInput,
                    attributes: [],
                }
            ),
            separator,
            Component.textInput(
                [
                    Html.style("flex-basis", "10%"),
                    Html.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id.id}_start`,
                    label: Layout.column(
                        "div",
                        [Html.paddingXY(8, 0)],
                        [Layout.text('Inicio')]
                    ),
                    value: record.startInput,
                    attributes: [],
                }
            ),
            separator,
            Component.textInput(
                [
                    Html.style("flex-basis", "10%"),
                    Html.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id.id}_end`,
                    label: Layout.column(
                        "div",
                        [Html.paddingXY(8, 0)],
                        [Layout.text('Fin')]
                    ),
                    value: record.endInput,
                    attributes: [],
                }
            ),
            separator,
            Component.textInput(
                [
                    Html.style("flex-basis", "10%"),
                    Html.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id.id}_duration`,
                    label: Layout.column(
                        "div",
                        [Html.paddingXY(8, 0)],
                        [Layout.text('Duración')]
                    ),
                    value: Time.toString(Time.difference(record.endTime, record.startTime)),
                    attributes: [],
                }
            ),
            separator,
            Layout.withSpacingY(
                8,
                Layout.column(
                    "div",
                    [
                        Html.style("width", "16px"),
                        Html.style("color", Color.toCssString(Color.gray500)),
                        Html.style("justify-content", "flex-start"),
                    ],
                    [
                        Icon.button(
                            [
                                Html.attribute("class", "visible-when-record-is-hovered visible-when-focused"),
                            ],
                            Icon.play()
                        ),
                        Icon.button(
                            [
                                Html.attribute("class", "visible-when-record-is-hovered visible-when-focused"),
                            ],
                            Icon.options()
                        ),
                    ]
                )
            )
        ]
    )
}

export function mapWithId(records: Array<Record>, id: Id, fn: (record: Record) => Record): Array<Record> {
    return records.map(record =>
        hasId(id, record)
            ? fn(record)
            : record
    )
}

export function deleteWithId(records: Array<Record>, id: Id): Array<Record> {
    return records.filter(record => !hasId(id, record))
}

export const idDecoder: Decoder.Decoder<Id> =
    Decoder.map2(
        Decoder.property('tag', Decoder.literal('recordId')),
        Decoder.property('id', Decoder.number),
        (_, x) => id(x)
    )

export const decoder: Decoder.Decoder<Record> =
    Decoder.map8(
        Decoder.property('id', idDecoder),
        Decoder.property('description', Decoder.string),
        Decoder.property('startInput', Decoder.string),
        Decoder.property('startTime', Time.decoder),
        Decoder.property('endInput', Decoder.string),
        Decoder.property('endTime', Time.decoder),
        Decoder.property('taskInput', Decoder.string),
        Decoder.property('date', Date.decoder),
        (id, description, startInput, startTime, endInput, endTime, taskInput, date) =>
            ({
                id,
                description,
                startInput,
                startTime,
                endInput,
                endTime,
                taskInput,
                date
            })
    )

export function search(query: string, records: Array<Record>): Array<Record> {
    if (query === "")
        return []
    else
        return records.map<[Record, number]>(record =>
            [record, Levenshtein.distance(query.toLowerCase(), record.description.toLowerCase())]
        )
            .sort((a: [Record, number], b: [Record, number]) => {
                const [recordA, distanceA] = a
                const [recordB, distanceB] = b

                return distanceA - distanceB
            })
            .map(([record, _]) => record)
}

export function recordCss(): string {
    return `

.visible-when-record-is-hovered,
.visible-when-focused {
    opacity: 0%;
    transition: opacity 0.2s ease-out;
}

.record:hover .visible-when-record-is-hovered {
    opacity: 100%;
}

.visible-when-focused:focus,
.visible-when-focused:focus + .visible-when-focused {
    opacity: 100%;
}

`;
}

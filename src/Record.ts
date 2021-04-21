
import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Update from './Update'
import * as Levenshtein from './utils/Levenshtein'
import * as Input from './Input'
import * as Layout from './utils/layout/Layout'
import * as Component from './style/Component'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Attribute from './utils/layout/Attribute'
import * as Decoder from './utils/decoder/Decoder'
import * as Time from './utils/Time'
import * as Date from './utils/Date'

export type Id = {
    tag: "recordId",
    id: number,
}

export function id(id: number): Id {
    return { tag: "recordId", id }
}

export function idEquals(a: Id, b: Id): boolean {
    return a.id === b.id
}

// RECORD ---


export type Record = {
    id: Id,
    description: string,
    startInput: string,
    startTime: Time.Time,
    endInput: string,
    endTime: Time.Time,
    taskInput: string,
    date: Date.Date
}

export function record(
    id: Id,
    description: string,
    start: Time.Time,
    end: Time.Time,
    taskInput: string,
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
    return idEquals(id, record.id)
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
    return Time.compare(a.startTime, b.startTime)
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

export function view(record: Record): Layout.Layout<Update.Event> {
    const input = (inputName: Input.RecordInputName) => Input.record(record, inputName)

    return Layout.row(
        "div",
        [
            Attribute.attribute("class", "parent"),
            Attribute.spacing(18),
        ],
        [
            Component.textInput(
                [
                    Attribute.style("flex-basis", "40%"),
                ],
                {
                    id: `record_${record.id}_description`,
                    label: Layout.column(
                        "div",
                        [Attribute.paddingXY(8, 0)],
                        [Layout.text('Descripción')]
                    ),
                    value: record.description,
                    attributes: [
                        Attribute.on("input", (event: any) => Update.onInput(input("description"), event?.target?.value || "")),
                    ],
                }
            ),
            Component.textInput(
                [
                    Attribute.style("flex-basis", "20%"),
                ],
                {
                    id: `record_${record.id}_task`,
                    label: Layout.column(
                        "div",
                        [Attribute.paddingXY(8, 0)],
                        [Layout.text('Tarea')]
                    ),
                    value: record.taskInput,
                    attributes: [
                        Attribute.on("input", (event: any) => Update.onInput(input("task"), event?.target?.value || "")),
                    ],
                }
            ),
            Component.textInput(
                [
                    Attribute.style("flex-basis", "10%"),
                    Attribute.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id}_start`,
                    label: Layout.column(
                        "div",
                        [Attribute.paddingXY(8, 0)],
                        [Layout.text('Inicio')]
                    ),
                    value: record.startInput,
                    attributes: [
                        Attribute.on("input", (event: any) => Update.onInput(input("startTime"), event?.target?.value || "")),
                    ],
                }
            ),
            Component.textInput(
                [
                    Attribute.style("flex-basis", "10%"),
                    Attribute.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id}_end`,
                    label: Layout.column(
                        "div",
                        [Attribute.paddingXY(8, 0)],
                        [Layout.text('Fin')]
                    ),
                    value: record.endInput,
                    attributes: [
                        Attribute.on("input", (event: any) => Update.onInput(input("endTime"), event?.target?.value || "")),
                    ],
                }
            ),
            Component.textInput(
                [
                    Attribute.style("flex-basis", "10%"),
                    Attribute.style("text-align", "right"),
                ],
                {
                    id: `record_${record.id}_duration`,
                    label: Layout.column(
                        "div",
                        [Attribute.paddingXY(8, 0)],
                        [Layout.text('Duración')]
                    ),
                    value: Time.toString(Time.difference(record.endTime, record.startTime)),
                    attributes: [],
                }
            ),
            Layout.column(
                "div",
                [
                    Attribute.attribute("class", "parent-hover-makes-visible"),
                    Attribute.style("width", "16px"),
                    Attribute.spacing(8),
                    Attribute.style("color", Color.toCssString(Color.gray500)),
                    Attribute.style("justify-content", "flex-end"),
                ],
                [
                    Icon.button(
                        [
                            //Attribute.on("click", (_) => Update.clickedButton(Button.resumeRecord(record.id))),
                        ],
                        Icon.play()
                    ),
                    Icon.button(
                        [
                            //Attribute.on("click", (_) => Update.clickedButton(Button.deleteRecord(record.id))),
                        ],
                        Icon.delete_()
                    ),
                    Icon.button(
                        [
                            //Attribute.on("click", (_) => Update.clickedButton(Button.deleteRecord(record.id))),
                        ],
                        Icon.options()
                    ),
                ]
            ),
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

.parent > .parent-hover-makes-visible {
    opacity: 0%;
    transition: opacity 0.2s ease-out;
}

.parent:hover > .parent-hover-makes-visible {
    opacity: 100%;
}

`;
}


import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Task from './Task'
import * as Update from './Update'
import * as Levenshtein from './utils/Levenshtein'
import * as Input from './Input'
import * as Layout from './utils/layout/Layout'
import * as Component from './style/Component'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Attribute from './utils/layout/Attribute'
import * as Decoder from './utils/decoder/Decoder'

export type Id = {
    tag: "recordId",
    id: number,
}

export function recordId(id: number): Id {
    return { tag: "recordId", id }
}

export function idEq(a: Id, b: Id): boolean {
    return a.id === b.id
}

// RECORD ---


export type Record = {
    id: Id,
    description: string,
    startInput: string,
    startDate: Date,
    endInput: string,
    endDate: Date,
    taskInput: string,
    taskId: Task.Id,
}

export function record(
    description: string,
    startDate: Date,
    endDate: Date,
    id: Id,
    task: Task.Task
): Record {
    return {
        description,
        startInput: Utils.dateToString(startDate),
        startDate,
        endInput: Utils.dateToString(endDate),
        endDate,
        taskId: task.id,
        taskInput: task.description,
        id
    }
}

export function matchesId(id: Id, record: Record): boolean {
    return idEq(id, record.id)
}

export function withDescription(description: string, record: Record): Record {
    return { ...record, description }
}

export function withTask(taskInput: string, taskId: Maybe.Maybe<Task.Id>, record: Record): Record {
    return { ...record, taskInput, taskId: taskId.withDefault(record.taskId) }
}

export function updateStart(startInput: string, record: Record): Record {
    return {
        ...record,
        startInput,
        startDate: Utils.dateFromString(record.startDate, startInput).withDefault(record.startDate)
    }
}

export function updateEnd(endInput: string, record: Record): Record {
    return {
        ...record,
        endInput,
        endDate: Utils.dateFromString(record.endDate, endInput).withDefault(record.endDate)
    }
}

export function compare(a: Record, b: Record): -1 | 0 | 1 {
    return Number(a.startDate) < Number(b.startDate)
        ? -1
        : Number(a.startDate) > Number(b.startDate)
            ? 1
            : 0
}

/** If a date is mispelled or the task is invalid, reset the input value to the last valid value. */
export function save(tasks: Array<Task.Task>, record: Record, today: Date): Record {
    return {
        id: record.id,
        description: record.description,
        ...Utils.dateFromString(today, record.startInput)
            .map(startDate => ({ startDate, startInput: record.startInput }))
            .withDefault({ startDate: record.startDate, startInput: Utils.dateToString(record.startDate) }),
        ...Utils.dateFromString(today, record.endInput)
            .map(endDate => ({ endDate, endInput: record.endInput }))
            .withDefault({ endDate: record.endDate, endInput: Utils.dateToString(record.endDate) }),
        ...Maybe.fromUndefined(tasks.find(task => task.description === record.taskInput))
            .map(task => ({ taskId: task.id, taskInput: task.description }))
            .withDefault(
                Maybe.fromUndefined(tasks.find(task => Task.matchesId(record.taskId, task)))
                    .map(task => ({ taskId: task.id, taskInput: task.description }))
                    .withDefault({ taskId: Task.taskId(0), taskInput: "" })
            ),
    }
}

export function view(record: Record, tasks: Array<Task.Task>): Layout.Layout<Update.Event> {
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
                    value: Utils
                        .timeDifferenceToString(Utils.dateDifference(record.endDate, record.startDate)),
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
        matchesId(id, record)
            ? fn(record)
            : record
    )
}

export function deleteWithId(records: Array<Record>, id: Id): Array<Record> {
    return records.filter(record => !matchesId(id, record))
}

export const idDecoder: Decoder.Decoder<Id> =
    Decoder.map2(
        Decoder.property('tag', Decoder.literal('recordId')),
        Decoder.property('id', Decoder.number),
        (_, id) =>
            recordId(id)
    )

export const decoder: Decoder.Decoder<Record> =
    Decoder.map8(
        Decoder.property('id', idDecoder),
        Decoder.property('taskId', Task.idDecoder),
        Decoder.property('description', Decoder.string),
        Decoder.property('startInput', Decoder.string),
        Decoder.property('startDate', Decoder.string),
        Decoder.property('endInput', Decoder.string),
        Decoder.property('endDate', Decoder.string),
        Decoder.property('taskInput', Decoder.string),
        (id, taskId, description, startInput, startDate, endInput, endDate, taskInput) =>
            ({
                id,
                taskId,
                description,
                startInput,
                startDate: new Date(startDate),
                endInput,
                endDate: new Date(endDate),
                taskInput
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

export function filterUsingTask(taskId: Task.Id, records: Array<Record>): Array<Record> {
    return records.filter(record => Task.idEq(taskId, record.taskId))
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

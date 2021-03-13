
import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Task from './Task'
import * as Update from './Update'
import * as View from './View'
import * as Levenshtein from './utils/Levenshtein'
import * as Input from './Input'
import * as Button from './Button'
import * as Html from './utils/vdom/Html'
import * as Layout from './utils/layout/Layout'
import * as Component from './style/Component'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Attribute from './utils/layout/Attribute'

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

/** If a date is mispelled or the task is invalid, reset the input value to the last valid value. */
export function normalizeInputs(tasks: Array<Task.Task>, record: Record): Record {
    return {
        ...record,
        startInput: Utils.dateToString(record.startDate),
        endInput: Utils.dateToString(record.endDate),
        taskInput: Maybe
            .fromUndefined(
                tasks.find(task => Task.matchesId(record.taskId, task))
            )
            .map(task => task.description)
            .withDefault("")
    }
}

export function view(record: Record, tasks: Array<Task.Task>): Layout.Layout<Update.Event> {
    const input = (inputName: Input.RecordInputName) => Input.record(record, inputName)

    return Layout.row(
        "div",
        [
            Attribute.spacing(18),
        ],
        [
            Component.textInput(
                [
                    Attribute.style("flex-basis", "40%"),
                ],
                {
                    id: `record-${record.id}-description`,
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
                    id: `record-${record.id}-task`,
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
                    id: `record-${record.id}-start`,
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
                    id: `record-${record.id}-end`,
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
                    id: `record-${record.id}-duration`,
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
                    Attribute.style("width", "24px"),
                    Attribute.spacing(10),
                    Attribute.style("color", Color.toCssString(Color.gray500)),
                    Attribute.style("justify-content", "flex-end"),
                ],
                [
                    Layout.column(
                        "button",
                        [
                            //Attribute.on("click", (_) => Update.clickedButton(Button.resumeRecord(record.id))),
                            Attribute.style("width", "24px"),
                            Attribute.style("height", "24px"),
                        ],
                        [
                            Layout.html(Icon.options())
                        ]
                    ),
                    /*
                    Layout.column(
                        "button",
                        [
                            Attribute.on("click", (_) => Update.clickedButton(Button.deleteRecord(record.id))),
                            Attribute.style("width", "24px"),
                            Attribute.style("height", "24px"),
                        ],
                        [
                            Layout.html(Icon.delete_())
                        ]
                    ),
                    */
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

export function decodeJsonId(json: any): Maybe.Maybe<Id> {
    if (typeof json === "object"
        && json.tag === "recordId"
        && typeof json.id === "number"
    )
        return Maybe.just(recordId(json.id))
    return Maybe.nothing()
}

export function decode(json: any): Maybe.Maybe<Record> {
    if (typeof json === "object"
        && typeof json.description === "string"
        && typeof json.startInput === "string"
        && typeof json.startDate === "string"
        && typeof json.endInput === "string"
        && typeof json.endDate === "string"
        && typeof json.taskInput === "string"
    )
        return Maybe.map2(
            decodeJsonId(json.id),
            Task.decodeJsonId(json.taskId),
            (id, taskId) => ({
                id, taskId,
                description: json.description,
                startInput: json.startInput,
                endInput: json.endInput,
                startDate: new Date(json.startDate),
                endDate: new Date(json.endDate),
                taskInput: json.taskInput
            })
        )
    return Maybe.nothing()
}

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

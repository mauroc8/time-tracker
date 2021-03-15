
import * as Task from './Task'
import * as Input from './Input'
import * as Record from './Record'
import * as Button from './Button'
import * as Update from './Update'

import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Result from './utils/Result'

import * as Html from './utils/vdom/Html'

import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

import * as Component from './style/Component'

/** State of the 'create record' form.
 */
export type CreateRecord = {
    description: string,
    start: Maybe.Maybe<{ input: string, date: Date }>,
    taskId: Maybe.Maybe<Task.Id>,
    taskInput: string,
}

export function empty(description: string): CreateRecord {
    return {
        description,
        start: Maybe.nothing(),
        taskId: Maybe.nothing(),
        taskInput: '',
    }
}

export function start(date: Date): { input: string, date: Date } {
    return {
        input: Utils.dateToString(date),
        date
    }
}


export function withTask(taskInput: string, taskId: Maybe.Maybe<Task.Id>, createRecord: CreateRecord): CreateRecord {
    return { ...createRecord, taskId, taskInput }
}

export function updateStartTime(startInput: string, createRecord: CreateRecord): CreateRecord {
    return {
        ...createRecord,
        start: createRecord.start.map(start => ({
            input: startInput,
            date: Utils.dateFromString(start.date, startInput).withDefault(start.date)
        }))
    }
}

export function normalizeInputs(tasks: Array<Task.Task>, createRecord: CreateRecord): CreateRecord {
    return {
        ...createRecord,
        start: createRecord.start.map(start => ({
            input: Utils.dateToString(start.date),
            date: start.date
        })),
        taskInput: createRecord.taskId.andThen(taskId =>
            Maybe.fromUndefined(tasks.find(task => Task.matchesId(taskId, task)))
        )
            .map(task => task.description)
            .withDefault("")
    }
}


export class Error {
    readonly emptyDescription: boolean
    readonly emptyTask: boolean

    private constructor(
        emptyDescription: boolean,
        emptyTask: boolean,
    ) {
        this.emptyDescription = emptyDescription
        this.emptyTask = emptyTask
    }

    static none(): Error {
        return new Error(false, false)
    }

    withEmptyDescription(): Error {
        return new Error(
            true,
            this.emptyTask,
        )
    }

    withEmptyTask(): Error {
        return new Error(
            this.emptyDescription,
            true,
        )
    }

    static equals(a: Error, b: Error): boolean {
        return a.emptyDescription === b.emptyDescription
            && a.emptyTask === b.emptyTask
    }
}

function getError(createRecord: CreateRecord): Error {
    function getErrorOfTask(createRecord: CreateRecord) {
        return createRecord.taskId
            .map(_ => Error.none())
            .orElse(() => Error.none().withEmptyTask())
    }

    if (createRecord.description.trim() === "") {
        return getErrorOfTask(createRecord).withEmptyDescription()
    } else {
        return getErrorOfTask(createRecord)
    }
}


export function toRecord(
    tasks: Array<Task.Task>,
    endDate: Date,
    createRecord: CreateRecord,
): Result.Result<Record.Record, Error> {
    if (!Error.equals(getError(createRecord), Error.none()))
        return Result.error<Record.Record, Error>(getError(createRecord))

    return Result.fromMaybe<Record.Record, Error>(
        getError(createRecord),
        Maybe
            .map2(
                createRecord.start,
                createRecord.taskId,
                (start, taskId) =>
                    Maybe
                        .fromUndefined(tasks.find(task => Task.matchesId(taskId, task)))
                        .map(task =>
                            Record.record(
                                createRecord.description,
                                start.date,
                                endDate,
                                Record.recordId(endDate.getUTCMilliseconds()),
                                task
                            )
                        )
            )
            .andThen(m => m)
    )
}

export function view(
    attributes: Array<Attribute.Attribute<Update.Event>>,
    args: {
        createRecord: CreateRecord,
        records: Array<Record.Record>,
        tasks: Array<Task.Task>,
    }): Layout.Layout<Update.Event> {
    const task = args.createRecord.taskId.andThen(taskId => Task.find(taskId, args.tasks))

    const redBorder: Attribute.Attribute<Update.Event> =
        Attribute.style("borderColor", "red")

    const descriptionInput = Input.createRecord("description")
    const taskInput = Input.createRecord("task")

    return Layout.row<Update.Event>(
        "div",
        attributes,
        [
            Component.textInput(
                [],
                {
                    id: "createRecord-description",
                    label: Layout.text("Descripción"),
                    value: args.createRecord.description,
                    attributes: [
                        (() => {
                            if (getError(args.createRecord).emptyDescription) {
                                return redBorder
                            } else {
                                return Attribute.empty()
                            }
                        })(),
                        Attribute.on("change", (event: any) =>
                            Update.onInput(descriptionInput, event?.target?.value || "")
                        ),
                    ] as Array<Attribute.Attribute<Update.Event>>,
                }
            ),
            Component.textInput(
                [],
                {
                    id: "createRecord-task",
                    label: Layout.text("Tarea"),
                    value: args.createRecord.taskInput,
                    attributes: (() => {
                        if (getError(args.createRecord).emptyTask) {
                            return [redBorder]
                        } else {
                            return [Attribute.empty()]
                        }
                    })() as Array<Attribute.Attribute<Update.Event>>,
                }
            ),
            ...args.createRecord.start.map<Array<Layout.Layout<Update.Event>>>(start => [
                Component.textInput(
                    [],
                    {
                        id: "create-record-start-time",
                        label: Layout.text("Start time"),
                        value: start.input,
                        attributes: [
                            Attribute.on(
                                "input",
                                (event: any) =>
                                    Update.onInput(Input.createRecord("startTime"), event?.target?.value || "")
                            )
                        ],
                    }
                ),
                Layout.html(Html.node(
                    "button",
                    [
                        Html.on("click", (event: any) => Update.clickedButton(Button.stop()))
                    ],
                    [
                        Html.text("Parar"),
                    ]
                ))
            ])
                .withDefault([
                    Layout.html(Html.node(
                        "button",
                        [
                            Html.on("click", (_) => Update.clickedButton(Button.play()))
                        ],
                        [
                            Html.text("Empezar")
                        ]
                    ))
                ])
        ]
    )
}


function decodeStartDate(json: any): Maybe.Maybe<{ input: string, date: Date }> {
    if (typeof json === "object"
        && typeof json.input === "string"
        && typeof json.date === "string"
    )
        return Maybe.just<{ input: string, date: Date }>({
            input: json.input,
            date: new Date(json.date)
        })
    else
        return Maybe.nothing()
}

export function decodeJson(json: unknown): Maybe.Maybe<CreateRecord> {
    if (typeof json === "object"
        && json !== null
        && typeof (json as { description?: unknown }).description === "string"
        && typeof (json as { taskInput?: unknown }).taskInput === "string"
    ) {
        const json_ = json as {
            start?: unknown,
            taskId?: unknown,
            description: string,
            taskInput: string
        }

        return Maybe.map2(
            Maybe.decodeJson(json_.start, decodeStartDate),
            Maybe.decodeJson(json_.taskId, Task.decodeJsonId),
            (start, taskId) => ({
                description: json_.description,
                start: start,
                taskId: taskId,
                taskInput: json_.taskInput
            })
        )
    }
    else
        return Maybe.nothing()
}

export function fromRecord(record: Record.Record, tasks: Array<Task.Task>): CreateRecord {
    return {
        description: record.description,
        start: Maybe.nothing(),
        taskId: Maybe.just(record.taskId),
        taskInput: Maybe.fromUndefined(
            tasks.find(task => Task.matchesId(record.taskId, task))
        )
            .map(task => task.description)
            .withDefault("")
    }
}

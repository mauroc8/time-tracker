
import * as Task from './Task'
import * as Input from './Input'
import * as Record from './Record'
import * as Button from './Button'
import * as Update from './Update'

import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Result from './utils/Result'

import * as Html from './utils/vdom/Html'

import * as Decoder from './utils/decoder/Decoder'

import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

import * as Component from './style/Component'

/** State of the 'create record' form.
 */
export type CreateRecord = {
    descriptionInputValue: string,
    taskInputValue: string,
    startInputValue: string,
    startDate: Maybe.Maybe<Date>,
    taskId: Maybe.Maybe<Task.Id>,
}

export function empty(descriptionInputValue: string): CreateRecord {
    return {
        descriptionInputValue,
        taskInputValue: '',
        startInputValue: '',
        startDate: Maybe.nothing(),
        taskId: Maybe.nothing(),
    }
}

export function start(date: Date): { input: string, date: Date } {
    return {
        input: Utils.dateToString(date),
        date
    }
}


export function withTask(taskInputValue: string, taskId: Maybe.Maybe<Task.Id>, createRecord: CreateRecord): CreateRecord {
    return { ...createRecord, taskId, taskInputValue }
}

export function updateStartTime(startInputValue: string, createRecord: CreateRecord): CreateRecord {
    return createRecord.startDate.andThen(startDate =>
        Utils.dateFromString(startDate, startInputValue)
    )
        .map(newStartDate => ({
            ...createRecord,
            startInputValue,
            startDate: Maybe.just(newStartDate),
        }))
        .withDefault({ ...createRecord, startInputValue })
}

export function sanitizeInputs(tasks: Array<Task.Task>, createRecord: CreateRecord): CreateRecord {
    return {
        ...createRecord,
        startInputValue:
            createRecord.startDate
                .map(Utils.dateToString)
                .withDefault(''),
        taskInputValue:
            createRecord.taskId.andThen(taskId =>
                Maybe.fromUndefined(tasks.find(task => Task.matchesId(taskId, task)))
            )
            .map(task => task.description)
            .withDefault(''),
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

    if (createRecord.descriptionInputValue.trim() === "") {
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
                createRecord.startDate,
                createRecord.taskId,
                (startDate, taskId) =>
                    Maybe
                        .fromUndefined(tasks.find(task => Task.matchesId(taskId, task)))
                        .map(task =>
                            Record.record(
                                createRecord.descriptionInputValue,
                                startDate,
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
                    value: args.createRecord.descriptionInputValue,
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
                    value: args.createRecord.taskInputValue,
                    attributes: (() => {
                        if (getError(args.createRecord).emptyTask) {
                            return [redBorder]
                        } else {
                            return [Attribute.empty()]
                        }
                    })() as Array<Attribute.Attribute<Update.Event>>,
                }
            ),
            ...args.createRecord.startDate.map<Array<Layout.Layout<Update.Event>>>(startDate => [
                Component.textInput(
                    [],
                    {
                        id: "create-record-start-time",
                        label: Layout.text("Start time"),
                        value: args.createRecord.startInputValue,
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

export const decoder: Decoder.Decoder<CreateRecord> =
    Decoder.map5(
        Decoder.property('descriptionInputValue', Decoder.string),
        Decoder.property('taskInputValue', Decoder.string),
        Decoder.property('startInputValue', Decoder.string),
        Decoder.property('startDate', Decoder.maybe(Decoder.string)),
        Decoder.property('taskId', Decoder.maybe(Task.idDecoder)),
        (descriptionInputValue, taskInputValue, startInputValue, startDate, taskId) =>
            ({
                descriptionInputValue,
                taskInputValue,
                startInputValue,
                startDate: startDate.map(date => new Date(date)),
                taskId
            })
    )

export function resumeRecord(now: Date, record: Record.Record, tasks: Array<Task.Task>): CreateRecord {
    return {
        descriptionInputValue: record.description,
        startInputValue: Utils.dateToString(now),
        startDate: Maybe.just(now),
        taskId: Maybe.just(record.taskId),
        taskInputValue: Maybe.fromUndefined(
            tasks.find(task => Task.matchesId(record.taskId, task))
        )
            .map(task => task.description)
            .withDefault('')
    }
}

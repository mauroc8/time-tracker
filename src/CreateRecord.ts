
import * as Update from "./Update"
import * as Maybe from './Maybe'
import * as Task from "./Task"
import * as Element from './Element'
import * as Utils from './Utils'
import * as Result from './Result'
import * as Record from './Record'
import * as Input from './Input'
import * as Button from './Button'
import * as AutoCompleteMenu from './AutoCompleteMenu'

import * as Html from './Html'

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
        taskInput: ""
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
            .map(task => task.name)
            .withDefault("")
    }
}


export type Error = {
    emptyDescription: boolean,
    emptyTask: boolean,
}

export function toRecord(
    tasks: Array<Task.Task>,
    endDate: Date,
    createRecord: CreateRecord,
): Result.Result<Record.Record, Error> {
    const errors = {
        emptyDescription: createRecord.description.trim() === "",
        emptyTask: createRecord.taskId.map(_ => false).withDefault(true)
    }

    if (errors.emptyDescription || errors.emptyTask)
        return Result.error<Record.Record, Error>(errors)

    return Result.fromMaybe<Record.Record, Error>(
        errors,
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
                                Record.recordId(endDate),
                                task
                            )
                        )
            )
            .andThen(m => m)
    )
}

export function view(args: {
    createRecord: CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    createRecordError: Maybe.Maybe<Error>,
    autoCompleteMenu: AutoCompleteMenu.AutoCompleteMenu,
    attributes: Array<Html.Attribute<Update.Event>>,
}): Html.Html<Update.Event> {
    const task = args.createRecord.taskId.andThen(taskId => Task.find(taskId, args.tasks))

    const errorStyles: Array<Html.Attribute<Update.Event>> = [
        Html.style("borderColor", "red")
    ]

    const descriptionInput = Input.createRecord("description")
    const taskInput = Input.createRecord("task")

    return Html.node(
        "div",
        args.attributes,
        [
            AutoCompleteMenu.inputWithLabel<Update.Event>({
                input: descriptionInput,
                createRecord: args.createRecord,
                records: args.records,
                tasks: args.tasks,
                label: "Description",
                value: args.createRecord.description,
                attributes: [],
                onAutoCompleteItemClick: (input, index) => Update.onAutoCompleteItemClick(input, index),
                autoCompleteMenu: args.autoCompleteMenu,
                inputAttributes: [
                    ...args.createRecordError
                        .map(error => error.emptyDescription ? errorStyles : [])
                        .withDefault([]),
                    Html.on("input", (event: any) =>
                        Update.onInput(descriptionInput, event?.target?.value || "")
                    ),
                    Html.on("focus", (_) =>
                        Update.onFocus(descriptionInput)
                    ),
                    Html.on("blur", (_) =>
                        Update.onBlur(descriptionInput)
                    ),
                    Html.on("keydown", (event: any) =>
                        Update.onKeyDown(descriptionInput, AutoCompleteMenu.keyDownEventKeyDecoder(event))
                    ),
                ]
            }),
            AutoCompleteMenu.inputWithLabel({
                input: Input.createRecord("task"),
                createRecord: args.createRecord,
                records: args.records,
                tasks: args.tasks,
                label: "Task",
                value: args.createRecord.taskInput,
                attributes: [],
                onAutoCompleteItemClick: (input, index) => Update.onAutoCompleteItemClick(input, index),
                autoCompleteMenu: args.autoCompleteMenu,
                inputAttributes: [
                    ...args.createRecordError
                        .map(error => error.emptyTask ? errorStyles : [])
                        .withDefault([]),
                    Html.on("input", (event: any) =>
                        Update.onInput(taskInput, event?.target?.value || "")
                    ),
                    Html.on("focus", (_) =>
                        Update.onFocus(taskInput)
                    ),
                    Html.on("blur", (_) =>
                        Update.onBlur(taskInput)
                    ),
                    Html.on("keydown", (event: any) =>
                        Update.onKeyDown(taskInput, AutoCompleteMenu.keyDownEventKeyDecoder(event))
                    ),
                ]
            }),
            Html.node(
                "div",
                [],
                args.createRecord.start.map<Array<Html.Html<Update.Event>>>(start => [
                    Element.inputWithLabel(
                        "create-record-start-time",
                        "Start time",
                        [
                            Html.property("value", start.input),
                            Html.on("input", (event: any) =>
                                Update.onInput(Input.createRecord("startTime"), event?.target?.value || ""))
                        ],
                    ),
                    Html.node(
                        "div",
                        [],
                        [
                            Html.node(
                                "button",
                                [
                                    Html.on("click", (event: any) => Update.clickedButton(Button.stop()))
                                ],
                                [
                                    Html.text("Stop"),
                                ]
                            )
                        ]
                    )
                ])
                    .withDefault([
                        Html.node(
                            "button",
                            [
                                Html.on("click", (_) => Update.clickedButton(Button.play()))
                            ],
                            [
                                Html.text("Play")
                            ]
                        )
                    ])
            )
            ,
        ]
    )
}


function castStart(json: any): Maybe.Maybe<{ input: string, date: Date }> {
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

export function cast(json: any): Maybe.Maybe<CreateRecord> {
    if (typeof json === "object"
        && typeof json.description === "string"
        && typeof json.taskInput === "string"
    )
        return Maybe.map2(
            Maybe.cast(json.start, castStart),
            Maybe.cast(json.taskId, Task.castId),
            (start, taskId) => ({
                description: json.description,
                start: start,
                taskId: taskId,
                taskInput: json.taskInput
            })
        )
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
            .map(task => task.name)
            .withDefault("")
    }
}

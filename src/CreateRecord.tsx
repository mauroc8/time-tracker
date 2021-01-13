import React from 'react'
import ReactDOM from 'react-dom'

import * as Update from "./Update"
import * as Maybe from './Maybe'
import * as Task from "./Task"
import * as View from './View'
import * as Utils from './Utils'
import * as Result from './Result'
import * as Record from './Record'
import * as Input from './Input'
import * as Button from './Button'
import * as AutoCompleteMenu from './AutoCompleteMenu'


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

export function view(args : {
    createRecord: CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    createRecordError: Maybe.Maybe<Error>,
    autoCompleteMenu: AutoCompleteMenu.AutoCompleteMenu,
    dispatch: Update.Dispatch,
    props: React.InputHTMLAttributes<HTMLDivElement>,
}): JSX.Element {
    const task = args.createRecord.taskId.andThen(taskId => Task.find(taskId, args.tasks))

    const errorProps = {
        style: {
            borderColor: "red"
        }
    }

    return <div {...args.props}>
        {AutoCompleteMenu.inputWithLabel({
            input: Input.createRecord("description"),
            createRecord: args.createRecord,
            records: args.records,
            tasks: args.tasks,
            label: "Description",
            value: args.createRecord.description,
            onChange: (input, value) => args.dispatch(Update.onInput(input, value)),    
            onFocus: (input) => args.dispatch(Update.onFocus(input)),
            onBlur: (input) => args.dispatch(Update.onBlur(input)),
            onKeyDown: (input, key) => args.dispatch(Update.onKeyDown(input, key)),
            onAutoCompleteItemClick: (input, index) => args.dispatch(Update.onAutoCompleteItemClick(input, index)),
            autoCompleteMenu: args.autoCompleteMenu,
            inputProps: args.createRecordError
                .map(error => error.emptyDescription ? errorProps : {})
                .withDefault({})
        })}
        {AutoCompleteMenu.inputWithLabel({
            input: Input.createRecord("task"),
            createRecord: args.createRecord,
            records: args.records,
            tasks: args.tasks,
            label: "Task",
            value: args.createRecord.taskInput,
            onChange: (input, value) => args.dispatch(Update.onInput(input, value)),    
            onFocus: (input) => args.dispatch(Update.onFocus(input)),
            onBlur: (input) => args.dispatch(Update.onBlur(input)),
            onKeyDown: (input, key) => args.dispatch(Update.onKeyDown(input, key)),
            onAutoCompleteItemClick: (input, index) => args.dispatch(Update.onAutoCompleteItemClick(input, index)),
            autoCompleteMenu: args.autoCompleteMenu,
            inputProps: args.createRecordError
                .map(error => error.emptyTask ? errorProps : {})
                .withDefault({})
        })}
        {args.createRecord.start.map(start => <>
            {View.inputWithLabel(
                "create-record-start-time",
                "Start time",
                {
                    value: start.input,
                    onInput: event => Update.onInput(Input.createRecord("startTime"), event.currentTarget.value),
                    onBlur: event => Update.onBlur(Input.createRecord("startTime")),
                },
            )}
            <div><button onClick={_ => args.dispatch(Update.clickedButton(Button.stop()))}>Stop</button></div>
        </>)
            .withDefault(<button onClick={_ => args.dispatch(Update.clickedButton(Button.play()))}>Play</button>)
        }
    </div>
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

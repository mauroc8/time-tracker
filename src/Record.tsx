import React from 'react'
import ReactDOM from 'react-dom'

import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Task from './Task'
import * as Update from './Update'
import * as View from './View'
import * as Levenshtein from './Levenshtein'
import * as Input from './Input'
import * as Button from './Button'

export type Id = {
    tag: "recordId",
    id: number,
}

export function recordId(now: Date): Id {
    return { tag: "recordId", id: now.getMilliseconds() }
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
        taskInput: task.name,
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
            .map(task => task.name)
            .withDefault("")
    }
}

export function view(record: Record, tasks: Array<Task.Task>, dispatch: Update.Dispatch): Array<JSX.Element> {
    function onInput(
        inputName: Input.RecordInputName
    ): (event: React.FormEvent<HTMLInputElement>) => void {
        return event => dispatch(Update.onInput(Input.record(record, inputName), event.currentTarget.value))
    }

    return [
        View.inputWithInvisibleLabel(
            `record-${record.id}-description`,
            'Descripción',
            {
                value: record.description,
                onInput: onInput("description"),
                onBlur: _ => dispatch(Update.gotRecordBlur(record.id)),
            }
        ),
        View.inputWithInvisibleLabel(
            `record-${record.id}-task`,
            'Tarea',
            {
                value: record.taskInput,
                onInput: onInput("task"),
                onBlur: _ => dispatch(Update.gotRecordBlur(record.id)),
            }
        ),
        View.inputWithInvisibleLabel(
            `record-${record.id}-start`,
            'Tiempo de inicio',
            {
                value: record.startInput,
                onInput: onInput("startTime"),
                onBlur: _ => dispatch(Update.gotRecordBlur(record.id)),
            }
        ),
        View.inputWithInvisibleLabel(
            `record-${record.id}-end`,
            'Tiempo de fin',
            {
                value: record.endInput,
                onInput: onInput("endTime"),
                onBlur: _ => dispatch(Update.gotRecordBlur(record.id)),
            }
        ),
        <>
            {Utils.timeDifferenceToString(Utils.dateDifference(record.endDate, record.startDate))}
        </>,
        <button
            onClick={(_) => dispatch(Update.clickedButton(Button.deleteRecord(record.id)))}
        >
            Delete
        </button>,
        <button
            onClick={(_) => dispatch(Update.clickedButton(Button.resumeRecord(record.id)))}
        >
            Resume
        </button>,
    ]
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

export function castId(json: any): Maybe.Maybe<Id> {
    if (typeof json === "object"
        && json.tag === "recordId"
        && typeof json.id === "number"
    )
        return Maybe.just(recordId(new Date(json.id)))
    return Maybe.nothing()
}

export function cast(json: any): Maybe.Maybe<Record> {
    if (typeof json === "object"
        && typeof json.description === "string"
        && typeof json.startInput === "string"
        && typeof json.startDate === "string"
        && typeof json.endInput === "string"
        && typeof json.endDate === "string"
        && typeof json.taskInput === "string"
    )
        return Maybe.map2(
            castId(json.id),
            Task.castId(json.taskId),
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

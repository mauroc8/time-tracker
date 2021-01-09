import * as React from 'react'

import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Task from './Task'
import * as Update from './Update'
import * as View from './View'
import * as CreateRecord from './CreateRecord'
import * as Result from './Result'
import * as Input from './Input'

export type Id = {
    tag: "RecordId",
    id: number,
}

export function recordId(now: Date): Id {
    return { tag: "RecordId", id: now.getMilliseconds() }
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
    return id.id === record.id.id
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
        <div>
            {Utils.timeDifferenceToString(Utils.dateDifference(record.endDate, record.startDate))}
        </div>
    ]
}

export function mapWithId(records: Array<Record>, id: Id, fn: (record: Record) => Record): Array<Record> {
    return records.map(record =>
        matchesId(id, record)
            ? fn(record)
            : record
    )
}

import * as Update from "./Update"
import * as Maybe from './Maybe'
import * as Task from "./Task"
import * as View from './View'
import * as Utils from './Utils'
import * as Result from './Result'
import * as Record from './Record'
import * as Input from './Input'


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

export function view(
    createRecord: CreateRecord,
    tasks: Array<Task.Task>,
    error: Maybe.Maybe<Error>,
    dispatch: Update.Dispatch,
    props: React.InputHTMLAttributes<HTMLFormElement>
): JSX.Element {
    const task = createRecord.taskId.andThen(taskId =>
        Maybe.fromUndefined(tasks.find(task => Task.matchesId(taskId, task)))
    )

    const errorProps = {
        style: {
            borderColor: "red"
        }
    }

    const onInput = (inputName: Input.CreateRecordInputName) =>
        (event: React.FormEvent<HTMLInputElement>) =>
            dispatch(Update.onInput(Input.createRecord(inputName), event.currentTarget.value))
    
    const onBlur = (_: React.FocusEvent<HTMLInputElement>) => dispatch(Update.gotCreateRecordBlur())

    return <form onSubmit={event => dispatch(Update.submittedCreateRecord(event.preventDefault.bind(event))) } {...props}>
        {View.inputWithLabel(
            "create-record-description",
            "Description",
            {
                value: createRecord.description,
                onInput: onInput("description"),
                onBlur,
                ...(error
                    .map(errors =>
                        errors.emptyDescription
                            ? errorProps
                            : {}
                    )
                    .withDefault({})
                ),
            }
        )}
        <div style={{ position: "relative" }}>
            {View.inputWithLabel(
                "create-record-task",
                "Task",
                {
                    onInput: onInput("task"),
                    value: createRecord.taskInput,
                    onBlur,
                    ...(error
                        .map(errors =>
                            errors.emptyTask
                                ? errorProps
                                : {}
                        )
                        .withDefault({})
                    ),
                },
            )}
            <div style={{ position: "absolute", top: "100%" }}>
                {Task.search(createRecord.taskInput, tasks)
                    .map((task, i) =>
                        <div
                            key={task.name}
                        >
                            {task.name}
                        </div>
                    )
                }
            </div>
        </div>
        <div>{task.map(task => task.name).withDefault("")}</div>
        {createRecord.start.map(start => <>
            {View.inputWithLabel(
                "create-record-start-time",
                "Start time",
                {
                    value: start.input,
                    onInput: onInput("startTime"),
                    onBlur,
                },
            )}
            <div><button onClick={_ => dispatch(Update.clickedStopButton())}>Stop</button></div>
        </>)
            .withDefault(<button onClick={_ => dispatch(Update.clickedPlayButton())}>Play</button>)
        }
    </form>
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
        && Maybe.cast(json.start, castStart).toBool()
        && Maybe.cast(json.taskId, Task.castId).toBool()
        && typeof json.taskInput === "string"
    )
        return Maybe.just<CreateRecord>({
            description: json.description,
            start: json.start as Maybe.Maybe<{ input: string, date: Date }>,
            taskId: json.taskId as Maybe.Maybe<Task.Id>,
            taskInput: json.taskInput
        })
    return Maybe.nothing()
}

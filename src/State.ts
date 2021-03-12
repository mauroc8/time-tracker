import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Task from './Task'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Effect from './utils/Effect'

// STATE ---

/** The whole state of the application.
 * 
*/
export type State = {
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
}

const backendTask = Task.task(
    Task.taskId(0),
    "Backend",
)

export function initialState<Event>(flags: any): [State, Effect.Effect<Event>] {
    try {
        return [
            cast(JSON.parse(flags)).withDefault(initialState_),
            Effect.none(),
        ]
    } catch (e) {
        return [initialState_, Effect.none()]
    }
}

const initialState_: State = {
    createRecord: CreateRecord.empty(""),
    records: [
        Record.record(
            "Login",
            new Date(new Date().getMilliseconds() - 10000000),
            new Date(new Date().getMilliseconds() - 5000000),
            Record.recordId(0),
            backendTask,
        ),
        Record.record(
            "Login",
            new Date(new Date().getMilliseconds() - 5000000),
            new Date(new Date().getMilliseconds() - 2000000),
            Record.recordId(1),
            backendTask,
        ),
        Record.record(
            "Login",
            new Date(new Date().getMilliseconds() - 2000000),
            new Date(new Date().getMilliseconds()),
            Record.recordId(2),
            backendTask,
        ),
    ],
    tasks: [
        backendTask,
        Task.task(
            Task.taskId(1),
            "Frontend",
        )
    ],
}

export function cast(json: any): Maybe.Maybe<State> {
    if (typeof json === "object"
        && json.records instanceof Array
        && json.tasks instanceof Array

    ) {
        return Maybe.map3(
            CreateRecord.decodeJson(json.createRecord),
            Maybe.combine((json.records as Array<any>).map((record: any) => Record.decode(record))),
            Maybe.combine((json.tasks as Array<any>).map((task: any) => Task.decode(task))),
            (createRecord, records, tasks) => ({
                createRecord,
                records,
                tasks,
            })
        )
    } else {
        return Maybe.nothing()
    }
}

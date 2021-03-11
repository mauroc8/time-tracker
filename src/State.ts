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
            new Date(-100),
            new Date(-50),
            Record.recordId(new Date()),
            backendTask,
        ),
        Record.record(
            "Login",
            new Date(-50),
            new Date(-20),
            Record.recordId(new Date()),
            backendTask,
        ),
        Record.record(
            "Login",
            new Date(-20),
            new Date(0),
            Record.recordId(new Date()),
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

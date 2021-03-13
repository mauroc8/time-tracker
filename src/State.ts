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
    today: Date,
}

const backendTask = Task.task(
    Task.taskId(0),
    "Backend",
)

export function initialState<Event>(flags: any): [State, Effect.Effect<Event>] {
    const today = new Date()

    try {
        return [
            cast(JSON.parse(flags), today).withDefault(initialStateHelp(today)),
            Effect.none(),
        ]
    } catch (e) {
        return [initialStateHelp(today), Effect.none()]
    }
}

function initialStateHelp(today: Date): State {
    return {
        createRecord: CreateRecord.empty(""),
        records: [
            Record.record(
                "Login",
                new Date(new Date().getTime() - 10000000),
                new Date(new Date().getTime() - 5000000),
                Record.recordId(0),
                backendTask,
            ),
            Record.record(
                "Login",
                new Date(new Date().getTime() - 5000000),
                new Date(new Date().getTime() - 2000000),
                Record.recordId(1),
                backendTask,
            ),
            Record.record(
                "Login",
                new Date(new Date().getTime() - 2000000),
                new Date(new Date().getTime()),
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
        today,
    }
}

export function cast(json: unknown, today: Date): Maybe.Maybe<State> {
    if (typeof json === "object"
        && json !== null
        && (json as { records?: any }).records instanceof Array
        && (json as { tasks?: any }).tasks instanceof Array
    ) {
        const json_ = json as { createRecord?: any, records: Array<any>, tasks: Array<any> }

        return Maybe.map3(
            CreateRecord.decodeJson(json_.createRecord),
            Maybe.combine((json_.records as Array<any>).map((record: any) => Record.decode(record))),
            Maybe.combine((json_.tasks as Array<any>).map((task: any) => Task.decode(task))),
            (createRecord, records, tasks) => ({
                createRecord,
                records,
                tasks,
                today
            })
        )
    } else {
        return Maybe.nothing()
    }
}

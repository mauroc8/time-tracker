import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Task from './Task'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Effect from './utils/Effect'
import * as Decoder from './utils/decoder/Decoder'

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

export function initialState<Event>(flags: string | null): [State, Effect.Effect<Event>] {
    const today = new Date()

    try {
        return [
            Decoder
                .decode(
                    flags && JSON.parse(flags),
                    decoder(today)
                )
                .withDefault(initialStateHelp(today)),
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

export function decoder(today: Date): Decoder.Decoder<State> {
    return Decoder.map3(
        Decoder.property('records', Decoder.array(Record.decoder)),
        Decoder.property('tasks', Decoder.array(Task.decoder)),
        Decoder.property('createRecord', CreateRecord.decoder),
        (records, tasks, createRecord) =>
            ({
                records,
                tasks,
                createRecord,
                today,
            })
    )
}

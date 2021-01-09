import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Task from './Task'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as DropDownMenu from './DropDownMenu'
import * as Effect from './Effect'

// STATE ---

/** The whole state of the application.
 * 
*/
export type State = {
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    createRecordError: Maybe.Maybe<CreateRecord.Error>,
    dropDownMenu: DropDownMenu.DropDownMenu
}

const backendTask = Task.task(
    Task.taskId(0),
    "Backend",
    Utils.rgba(0.1, 0.2, 0.3, 1.0),
)

export function initialState(): State {
    return Effect.getFromLocalStorage().perform()
        .withDefault(initialState_)
}

const initialState_: State = {
    createRecord: CreateRecord.empty(""),
    records: [
        Record.record(
            "Login",
            new Date(),
            new Date(),
            Record.recordId(new Date()),
            backendTask,
        )
    ],
    tasks: [
        backendTask,
        Task.task(
            Task.taskId(1),
            "Frontend",
            Utils.rgba(0.8, 0.7, 0.6, 1.0),
        )
    ],
    createRecordError: Maybe.nothing(),
    dropDownMenu: DropDownMenu.closed(),
}

export function cast(json: any): Maybe.Maybe<State> {
    if (typeof json === "object"
        && json.records instanceof Array
        && json.tasks instanceof Array

    ) {
        return Maybe.map3(
            CreateRecord.cast(json.createRecord),
            Maybe.combine((json.records as Array<any>).map((record: any) => Record.cast(record))),
            Maybe.combine((json.tasks as Array<any>).map((task: any) => Task.cast(task))),
            (createRecord, records, tasks) => ({
                createRecord,
                records,
                tasks,
                createRecordError: Maybe.nothing(),
                dropDownMenu: DropDownMenu.closed(),
            })
        )
    } else {
        return Maybe.nothing()
    }
}

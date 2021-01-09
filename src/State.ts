import * as Record from './Record'
import * as CreateRecord from './CreateRecord'
import * as Task from './Task'
import * as Utils from './Utils'
import * as Maybe from './Maybe'
import * as DropDownMenu from './DropDownMenu'

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

export const initialState: State = {
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

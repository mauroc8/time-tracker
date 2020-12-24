import * as React from 'react'
import ReactDOM from 'react-dom'

/** About this code
 * 
 * I'm using React only as a "virtual dom" library. I'm not creating components, nor
 * using any of React's features. (I find them unnecessary for this project.)
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 */



// STATE ---

/** The whole state of the time tracker.
 * 
*/
type State = {
    records: Array<Record>,
    tasks: Array<Task>,
}

/** The initial state.
 * 
 */
const initialState: State = {
    records: [
        {
            description: "My first task",
            start: new Date(),
            end: new Date(),
            task: { tag: "task-id", id: "task-0" }
        }
    ],
    tasks: [],
}


const App: React.FunctionComponent = () => {
    const [state, setState] = React.useState<State>(initialState)

    function dispatch(event: Event): void {
        setState(update(state, event))
    }

    return <>
        {createRecord(state.tasks, dispatch)}
        {state.records.map(record => showRecord(record, state.tasks, dispatch))}
    </>
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
)



// UPDATE ---


/** Event is what's typically called an "action" in Redux
 * 
*/
type Event =
    { tag: "none" }

/** The type of the dispatch function
 * 
 */
type Dispatch = (event: Event) => void

/** The main update functions. Decides how to modify state when an event comes in.
 * 
 */
function update(state: State, event: Event): State {
    return state
}



// RECORD ---


type Record = {
    description: string,
    start: Date,
    end: Date,
    task: TaskId,
}

function showRecord(record: Record, tasks: Array<Task>, dispatch: Dispatch): JSX.Element {
    return <>Show record</>
}

function createRecord(tasks: Array<Task>, dispatch: Dispatch): JSX.Element {
    return <>Create record</>
}



// TASK ---


type Task = {
    id: TaskId,
    name: string,
    color: string,
}

type TaskId = {
    tag: "task-id",
    id: string,
}

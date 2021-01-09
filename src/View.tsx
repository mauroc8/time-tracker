import * as State from './State'
import * as Update from './Update'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Style from './Style'
import * as Utils from './Utils'
import * as Task from './Task'

export function inputWithLabel(
    id: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>
): JSX.Element {
    return <label htmlFor={id}>
        <div>{label}</div>
        <input id={id} {...props}></input>
    </label>
}

export function inputWithInvisibleLabel(
    id: string,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>
): JSX.Element {
    return <label htmlFor={id}>
        <div style={{
            position: "absolute",
            left: "-100000px",
            top: "-100000px"
        }}>{label}</div>
        <input id={id} {...props}></input>
    </label>
}

export function view(state: State.State, dispatch: Update.Dispatch): JSX.Element {
    console.log({ ...state })

    return <>
        {bodyStyles()}
        {CreateRecord.view(
            state.createRecord,
            state.tasks,
            state.createRecordError,
            dispatch,
            {
                style: Style.spacing(20)
            }
        )}
        {viewRecordTable(state.records, state.tasks, dispatch)
            
        }
    </>
}

function viewRecordTable(
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    dispatch: Update.Dispatch
): JSX.Element {
    return <table>
        <thead>
            <tr>
                <th>Descripción</th>
                <th>Tarea</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración</th>
            </tr>
        </thead>
        <tbody>
            {records
                .map(record =>
                    <tr key={record.id.id} style={Style.spacing(20)}>
                        {Record.view(record, tasks, dispatch)
                            .map((x, i) => <td key={i}>{x}</td>)
                        }
                    </tr>
                )
            }
        </tbody>
    </table>
}

function bodyStyles(): JSX.Element {
    return <style>
        body {'{'}
            margin: 0;
            background-color: {Utils.toCssString({ r: 0.97, g: 0.98, b: 0.99, a: 1.0 })};
        {'}'}
    </style>
}

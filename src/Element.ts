
import * as State from './State'
import * as Update from './Update'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Utils from './Utils'
import * as Task from './Task'
import * as Html from './Html'

export function inputWithLabel<T>(
    id: string,
    label: string,
    attributes: Array<Html.Attribute<T>>
): Html.Html<T> {
    return Html.node(
        "label",
        [
            Html.attribute("for", id),
        ],
        [
            Html.node(
                "div",
                [],
                [Html.text(label)]
            ),
            Html.node(
                "input",
                [
                    Html.attribute("id", id),
                    ...attributes,
                ],
                []
            ),
        ]
    )
}

export function inputWithInvisibleLabel<T>(
    id: string,
    label: string,
    attributes: Array<Html.Attribute<T>>
): Html.Html<T> {
    return Html.node(
        "label",
        [Html.attribute("for", id)],
        [
            Html.node(
                "div",
                [
                    Html.style("position", "absolute"),
                    Html.style("left", "-99999px"),
                    Html.style("top", "-99999px"),
                ],
                [Html.text(label)]
            ),
            Html.node(
                "input",
                [
                    Html.attribute("id", id),
                    ...attributes,
                ],
                []
            ),
        ]
    )
}

export function view(state: State.State): Html.Html<Update.Event> {
    return Html.node(
        "div",
        [
            Html.attribute("id", "root")
        ],
        [
            bodyStyles(),
            CreateRecord.view({
                createRecord: state.createRecord,
                records: state.records,
                tasks: state.tasks,
                createRecordError: state.createRecordError,
                autoCompleteMenu: state.autoCompleteMenu,
                attributes: [
                    Html.style("margin", "10px"),
                ],
            }),
            viewRecordTable(state.records, state.tasks)
        ]
    )
}

function viewRecordTable(
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
): Html.Html<Update.Event> {
    return Html.node(
        "table",
        [],
        [
            Html.node(
                "thead",
                [],
                [
                    Html.node(
                        "tr",
                        [],
                        [
                            Html.node("th", [], [Html.text("Descripción")]),
                            Html.node("th", [], [Html.text("Tarea")]),
                            Html.node("th", [], [Html.text("Inicio")]),
                            Html.node("th", [], [Html.text("Fin")]),
                            Html.node("th", [], [Html.text("Duración")]),
                        ]
                    )
                ]
            ),
            Html.node(
                "tbody",
                [],
                records.map(record =>
                    Html.node(
                        "tr",
                        [],
                        Record.view(record, tasks)
                            .map(recordHtml =>
                                Html.node("td", [], [recordHtml])
                            )
                    )
                )
            ),
        ]
    )
}

function bodyStyles(): Html.Html<any> {
    return Html.node("style", [], [
        Html.text(`
            body {
                margin: 0;
                background-color: ${Utils.toCssString({ r: 0.97, g: 0.98, b: 0.99, a: 1.0 })};
            }
        `)
    ])
}

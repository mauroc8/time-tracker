
import * as State from './State'
import * as Update from './Update'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Color from './style/Color'
import * as Task from './Task'
import * as Html from './utils/vdom/Html'
import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

export function view(state: State.State): Html.Html<Update.Event> {
    return Layout.toHtml(
        Layout.column(
            "div",
            [],
            [
                Layout.column(
                    "div",
                    [
                        Attribute.style("background-color", Color.toCssString(Color.accent)),
                        Attribute.style("width", "100%"),
                        Attribute.style("height", "5px"),
                    ],
                    []
                ),
                Layout.column(
                    "div",
                    [
                        Attribute.spacing(10),
                        Attribute.padding(20),
                    ],
                    [
                        Layout.html(bodyStyles()),
                        /*CreateRecord.view(
                            [
                                Attribute.padding(10),
                            ],
                            {
                                createRecord: state.createRecord,
                                records: state.records,
                                tasks: state.tasks,
                            }
                        ),*/
                        viewRecords(state.records, state.tasks),
                    ]
                ),
            ]
        )
    )
}

function viewRecords(
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
): Layout.Layout<Update.Event> {
    return Layout.column(
        "div",
        [
            Attribute.spacing(50),
        ],
        records.map(record => Record.view(record, tasks))
    )
}

function bodyStyles(): Html.Html<any> {
    return Html.node("style", [], [
        Html.text(`

/* Reset */
* {
    margin: 0;
    padding: 0;
    text: inherit;
    box-sizing: inherit;
    text-decoration: inherit;
    font-weight: inherit;
    font-size: inherit;
    background: transparent;
    border: 0;
    transition: all 0.2s ease-out;
}
*:hover, *:focus, *:active {
    outline: 0;
}

html {
    box-sizing: border-box;
    line-height: 1;
}

/* Styles */

body {
    background-color: ${Color.toCssString(Color.background)};
    color: ${Color.toCssString(Color.gray700)};
    font-size: 16px;
    font-family: Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir, helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
}

input {
    background-color: ${Color.toCssString(Color.gray50)};
    color: ${Color.toCssString(Color.white)};
    font-size: 16px;
    letter-spacing: 0.04em;
    font-weight: 300;
    line-height: 38px;
    padding-left: 9px;
    padding-right: 9px;
}
input:focus {
    background-color: ${Color.toCssString(Color.black)};
}

        `)
    ])
}

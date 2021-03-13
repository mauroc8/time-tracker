
import * as State from './State'
import * as Update from './Update'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Color from './style/Color'
import * as Task from './Task'
import * as Html from './utils/vdom/Html'
import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'
import * as Array_ from './utils/Array'
import * as Utils from './utils/Utils'
import * as HumanTime from './utils/HumanTime'

export function view(state: State.State): Html.Html<Update.Event> {
    return Layout.toHtml(
        Layout.column(
            "div",
            [
                Attribute.style("align-items", "center"),
            ],
            [
                // CSS
                Layout.html(bodyStyles()),
                // CONTENT
                Layout.column(
                    "div",
                    [
                        Attribute.style("max-width", (1024 + 40) + "px"),
                        Attribute.style("padding", "0 20px"),
                    ],
                    [
                        Layout.space(50),
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
                        viewRecords(state.records, state.tasks, state.today),
                    ]
                ),
            ]
        )
    )
}

function viewRecords(
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    today: Date,
): Layout.Layout<Update.Event> {
    return Layout.column(
        "div",
        [
            Attribute.spacing(50),
        ],
        Array_.groupWhile(
            records
                .sort(
                    (a, b) =>
                        b.startDate.getTime() - a.startDate.getTime()
                ),
            (a, b) =>
                Utils.equals(
                    HumanTime.group({ today, time: a.startDate }),
                    HumanTime.group({ today, time: b.startDate })
                )
        )
            .map(group => viewRecordGroup(group, today, tasks))
    )
}

function viewRecordGroup(
    group: [Record.Record, Array<Record.Record>],
    today: Date,
    tasks: Array<Task.Task>
): Layout.Layout<Update.Event> {
    return Layout.column(
        "div",
        [
            Attribute.spacing(20),
        ],
        [
            Layout.row(
                "div",
                [
                    Attribute.style("color", Color.toCssString(Color.gray400)),
                    Attribute.style("font-size", "14px"),
                    Attribute.style("align-items", "baseline"),
                    Attribute.paddingXY(8, 0),
                    Attribute.spacing(18),
                ],
                [
                    Layout.column(
                        "div",
                        [
                            Attribute.style("flex-grow", "1"),
                            Attribute.style("height", "1px"),
                            Attribute.style(
                                "background-color",
                                Color.toCssString(Color.gray200)
                            )
                        ],
                        []
                    ),
                    Layout.column(
                        "div",
                        [
                            Attribute.style("white-space", "nowrap"),
                        ],
                        [
                            Layout.text(
                                HumanTime.groupToSpanishLabel(
                                    HumanTime.group({ today, time: group[0].startDate })
                                )
                            ),
                        ]
                    ),
                    Layout.column(
                        "div",
                        [
                            Attribute.style("flex-grow", "1"),
                            Attribute.style("height", "1px"),
                            Attribute.style(
                                "background-color",
                                Color.toCssString(Color.gray200)
                            )
                        ],
                        []
                    ),
                    /** Espacio vacío de los íconos */
                    Layout.column(
                        "div",
                        [
                            Attribute.style("width", "24px"),
                        ],
                        []
                    ),
                ]
            ),
            Layout.column(
                "div",
                [
                    Attribute.spacing(55),
                ],
                Array_.groupWhile(
                    [group[0], ...group[1]],
                    (a, b) =>
                        Utils.equals(
                            HumanTime.dayTag({ today, time: a.startDate }),
                            HumanTime.dayTag({ today, time: b.startDate }))
                )
                    .map(day => viewRecordDay(day, today, tasks))
            )
        ]
    )
}

function viewRecordDay(
    day: [Record.Record, Array<Record.Record>],
    today: Date,
    tasks: Array<Task.Task>,
): Layout.Layout<Update.Event> {
    return Layout.column(
        "div",
        [
            Attribute.spacing(20),
        ],
        [
            Layout.column(
                "div",
                [
                    Attribute.style("color", Color.toCssString(Color.accent)),
                    Attribute.style("font-size", "12px"),
                    Attribute.style("letter-spacing", "0.15em"),
                    Attribute.paddingXY(8, 0),
                ],
                [
                    Layout.text(
                        HumanTime.dayTagToSpanishLabel(
                            HumanTime.dayTag({ today, time: day[0].startDate })
                        )
                            .toUpperCase()
                    ),
                ]
            ),
            Layout.column(
                "div",
                [
                    Attribute.spacing(55),
                ],
                [day[0], ...day[1]].map((record) => Record.view(record, tasks))
            )
        ]
    )
}

function bodyStyles(): Html.Html<never> {
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
    color: inherit;
    text-align: inherit;
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
    font-family: Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir,
        helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    border-top: 6px solid ${Color.toCssString(Color.accent)};
    color: ${Color.toCssString(Color.gray700)};
}

label {
    color: ${Color.toCssString(Color.gray500)};
    font-size: 14px;
    letter-spacing: 0.08em;
    font-weight: 500;
}
input {
    background-color: ${Color.toCssString(Color.gray50)};
    color: ${Color.toCssString(Color.white)};
    font-size: 14px;
    letter-spacing: 0.04em;
    font-weight: 300;
    line-height: 38px;
    padding-left: 8px;
    padding-right: 8px;
}
input:focus {
    background-color: ${Color.toCssString(Color.black)};
}
        `)
    ])
}

import * as Task from './Task'
import * as Record from './Record'
import * as Update from './Update'


import * as Time from './utils/Time'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'


import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

import * as Color from './style/Color'


export function view(
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
                    Time.groupOf({ today, time: a.startDate }),
                    Time.groupOf({ today, time: b.startDate })
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
                                Time.groupToSpanishLabel(
                                    Time.groupOf({ today, time: group[0].startDate })
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
                            Time.dayTag({ today, time: a.startDate }),
                            Time.dayTag({ today, time: b.startDate }))
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
                        Time.dayTagToSpanishLabel(
                            Time.dayTag({ today, time: day[0].startDate })
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


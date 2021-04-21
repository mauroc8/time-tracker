import * as Task from './Task'
import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'


import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

import * as Icon from './style/Icon'
import * as Color from './style/Color'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }


export function view(
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    today: Date.Date,
): Layout.Layout<Update.Event> {
    return Layout.column(
        "div",
        [
            Attribute.spacing(50),
        ],
        Array_.groupWhile(
            records
                .sort(Record.compare),
            (a, b) =>
                Utils.equals(
                    Date.groupOf({ today, time: a.date }),
                    Date.groupOf({ today, time: b.date })
                )
        )
            .map(group => viewRecordGroup(group, today, tasks))
    )
}

function viewRecordGroup(
    group: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
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
                    Attribute.spacing(18),
                ],
                [
                    Layout.column(
                        "div",
                        [
                            Attribute.style("flex-grow", "1"),
                            Attribute.style("height", "1px"),
                            Attribute.style("margin-left", "8px"),
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
                                Date.groupToSpanishLabel(
                                    Date.groupOf({ today, time: group[0].date })
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
                    Icon.button(
                        [
                            Attribute.style("transform", `translateY(3px)`),
                        ],
                        Icon.chevronDown(),
                    ),
                ]
            ),
            Layout.column(
                "div",
                [
                    Attribute.spacing(55),
                ],
                Array_.groupWhile(
                    group,
                    (a, b) =>
                        Utils.equals(
                            Date.dayTag({ today, time: a.date }),
                            Date.dayTag({ today, time: b.date }))
                )
                    .map(day => viewRecordDay(day, today, tasks))
            )
        ]
    )
}

function viewRecordDay(
    day: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
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
                        Date.dayTagToSpanishLabel(
                            Date.dayTag({ today, time: day[0].date })
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
                day.map((record) => Record.view(record, tasks))
            )
        ]
    )
}


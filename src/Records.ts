import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'


import * as Layout from './utils/layout/Layout'

import * as Html from './utils/vdom/Html'

import * as Icon from './style/Icon'
import * as Color from './style/Color'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }


export function view<A>(
    records: Array<Record.Record>,
    today: Date.Date,
): Layout.Layout<A> {
    return Layout.columnWithSpacing(
        50,
        "div",
        [],
        Array_.groupWhile(
            records
                .sort(Record.compare),
            (a, b) =>
                Utils.equals(
                    Date.groupOf({ today, time: a.date }),
                    Date.groupOf({ today, time: b.date })
                )
        )
            .map(group => viewRecordGroup(group, today))
    )
}

function viewRecordGroup<A>(
    group: [Record.Record, ...Array<Record.Record>],
    today: Date.Date
): Layout.Layout<A> {
    return Layout.columnWithSpacing(
        20,
        "div",
        [],
        [
            Layout.rowWithSpacing(
                18,
                "div",
                [
                    Html.style("color", Color.toCssString(Color.gray400)),
                    Html.style("font-size", "14px"),
                    Html.style("align-items", "baseline"),
                ],
                [
                    Layout.node(
                        "div",
                        [
                            Html.style("flex-grow", "1"),
                            Html.style("height", "1px"),
                            Html.style("margin-left", "8px"),
                            Html.style(
                                "background-color",
                                Color.toCssString(Color.gray200)
                            )
                        ],
                        []
                    ),
                    Layout.node(
                        "div",
                        [
                            Html.style("display", "inline-flex"),
                            Html.style("white-space", "nowrap"),
                        ],
                        [
                            Layout.text(
                                Date.groupToSpanishLabel(
                                    Date.groupOf({ today, time: group[0].date })
                                )
                            ),
                        ]
                    ),
                    Layout.node(
                        "div",
                        [
                            Html.style("flex-grow", "1"),
                            Html.style("height", "1px"),
                            Html.style(
                                "background-color",
                                Color.toCssString(Color.gray200)
                            )
                        ],
                        []
                    ),
                    Icon.button(
                        [
                            Html.style("transform", `translateY(3px)`),
                        ],
                        Icon.chevronDown(),
                    ),
                ]
            ),
            Layout.columnWithSpacing(
                55,
                "div",
                [],
                Array_.groupWhile(
                    group,
                    (a, b) =>
                        Utils.equals(
                            Date.dayTag({ today, time: a.date }),
                            Date.dayTag({ today, time: b.date }))
                )
                    .map(day => viewRecordDay(day, today))
            )
        ]
    )
}

function viewRecordDay<A>(
    day: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
): Layout.Layout<A> {
    return Layout.columnWithSpacing(
        20,
        "div",
        [],
        [
            Layout.column(
                "div",
                [
                    Html.style("color", Color.toCssString(Color.accent)),
                    Html.style("font-size", "12px"),
                    Html.style("letter-spacing", "0.15em"),
                    Html.paddingXY(8, 0),
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
            Layout.columnWithSpacing(
                55,
                "div",
                [],
                day.map(record => Record.view(record))
            )
        ]
    )
}


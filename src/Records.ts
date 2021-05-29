import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Time from './utils/Time'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'
import * as Maybe from './utils/Maybe'


import * as Layout from './layout/Layout'

import * as Html from './vdom/Html'

import * as Icon from './style/Icon'
import * as Color from './style/Color'

import * as DateGroup from './DateGroup'
import * as TimeGroup from './TimeGroup'
import * as Transition from './Transition'
import * as Decoder from './utils/Decoder'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }

export function mockRecords(today: Date.Date): Records {
    return {
        tag: 'Records',
        array: [
            Record.record(
                Record.id(0),
                "1",
                "Time tracker",
                Time.time(22, 54),
                Time.time(23, 25),
                Date.date(2020, 4, 18),
            ),
            Record.record(
                Record.id(1),
                "2",
                "Study english",
                Time.time(7, 15),
                Time.time(10, 49),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(2),
                "Login",
                "Elm",
                Time.time(14, 37),
                Time.time(17, 53),
                Date.date(2021, 4, 22),
            ),
            Record.record(
                Record.id(3),
                "Siempre es hoy!",
                "",
                Time.time(16, 20),
                Time.time(18, 0),
                today
            ),
            Record.record(
                Record.id(4),
                "Y más tarde",
                "",
                Time.time(18, 20),
                Time.time(20, 0),
                today
            ),
            Record.record(
                Record.id(5),
                "Ayer",
                "",
                Time.time(16, 20),
                Time.time(18, 0),
                Date.date(today.year, today.month, today.day - 1),
            )
        ]
    }
}

export const decoder: Decoder.Decoder<Records> =
    Decoder.andThen(
        Decoder.property("tag", Decoder.string),
        tag => {
            if (tag === "Records") {
                return Decoder.map(
                    Decoder.array(Record.decoder),
                    array => ({ tag, array })
                )
            }
            return Decoder.fail(`tag "${tag}" is not equal to "Records"`)
        }
    )

export function view<A, C>(
    records: Array<Record.Record>,
    today: Date.Date,
    collapsedGroups: Array<DateGroup.Tag>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: DateGroup.Tag) => A,
): Layout.Layout<A, C> {
    return Layout.columnWithSpacing(
        50,
        "div",
        [Html.class_("w-full")],
        Array_.groupWhile(
            records
                .sort(Record.compare)
                .reverse(),
            (a, b) =>
                Utils.equals(
                    DateGroup.fromDate({ today, time: a.date }),
                    DateGroup.fromDate({ today, time: b.date })
                )
        )
            .map(group =>
                viewRecordsInDateGroup(
                    group,
                    today,
                    collapsedGroups,
                    collapsingTransition,
                    clickedCollapseButton,
                )
            )
    )
}

export type ViewTransition =
    | { tag: "uncollapsed" }
    | { tag: "aboutToCollapse", height: number }
    | { tag: "collapsing" }
    | { tag: "collapsed" }

export function viewTransitionOf(
    group: DateGroup.Tag,
    collapsedGroups: Array<DateGroup.Tag>,
    collapsingTransition: Transition.Collapsing,
): ViewTransition {
    switch (collapsingTransition.tag) {
        case 'aboutToCollapse':
            if (Utils.equals(collapsingTransition.group, group)) {
                return { tag: 'aboutToCollapse', height: collapsingTransition.height }
            }
            break;
        case 'collapsing':
            if (Utils.equals(collapsingTransition.group, group)) {
                return { tag: 'collapsing' }
            }
            break;
        case 'idle':
            break;
        default:
            Utils.assertNever(collapsingTransition)
            break;
    }

    if (groupIsCollapsed(group, collapsedGroups)) {
        return { tag: 'collapsed' }
    }

    return { tag: 'uncollapsed' }
}


export function groupIsCollapsed(group: DateGroup.Tag, collapsedGroups: Array<DateGroup.Tag>): boolean {
    return collapsedGroups.some(Utils.eq(group))
}

function isCollapsed(viewTransition: ViewTransition): boolean {
    return viewTransition.tag === 'collapsed'
}

function toCssHeight(viewTransition: ViewTransition): string {
    switch (viewTransition.tag) {
        case 'uncollapsed':
        case 'collapsed':
            return 'auto'
        case 'aboutToCollapse':
            return `${viewTransition.height}px`
        case 'collapsing':
            return `0px`
    }
}

function toOpacity(viewTransition: ViewTransition): number {
    switch (viewTransition.tag) {
        case 'collapsed':
        case 'collapsing':
            return 0
        case 'uncollapsed':
        case 'aboutToCollapse':
            return 1
    }
}

export const collapsingTransitionSeconds: number = 0.24

function viewRecordsInDateGroup<A, C>(
    records: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
    collapsedGroups: Array<DateGroup.Tag>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: DateGroup.Tag) => A,
): Layout.Layout<A, C> {
    const group = DateGroup.fromDate({ today, time: records[0].date })
    const viewTransition = viewTransitionOf(group, collapsedGroups, collapsingTransition)

    return Layout.columnWithSpacing(
        30,
        "div",
        [Html.class_("w-full")],
        [
            Layout.rowWithSpacing(
                10,
                "button",
                [
                    Html.class_("w-full"),
                    Html.class_("date-group-collapse-button"),
                    Html.style("align-items", "baseline"),
                    Html.style("padding", "5px"),
                    Html.style("margin", "-5px"),
                    Html.on("click", () => clickedCollapseButton(group)),
                    Html.attribute("aria-controls", DateGroup.toStringId(group)),
                ],
                [
                    Layout.space(8),
                    Layout.node("span", [], []),
                    Layout.node(
                        "div",
                        [
                            Html.style("display", "inline-flex"),
                            Html.style("white-space", "nowrap"),
                            Html.style("letter-spacing", "2px"),
                            Html.style("font-size", "10px"),
                        ],
                        [
                            Layout.text(DateGroup.toSpanishLabel(group).toUpperCase()),
                        ]
                    ),
                    Layout.node("span", [], []),
                ]
            ),
            Layout.columnWithSpacing(
                30,
                "div",
                [
                    Html.class_("w-full"),
                    Html.property("id", DateGroup.toStringId(group)),
                    Html.style(
                        "overflow",
                        viewTransition.tag === 'uncollapsed'
                            ? "visible"
                            : "hidden"
                    ),
                    Html.style(
                        "transition",
                        `
                            height ${collapsingTransitionSeconds}s ease-out,
                            opacity ${collapsingTransitionSeconds}s linear
                        `
                    ),
                    Html.style("height", toCssHeight(viewTransition)),
                    Html.style("opacity", `${toOpacity(viewTransition)}`),
                    Html.attribute("aria-expanded", String(!isCollapsed(viewTransition))),
                ],
                isCollapsed(viewTransition)
                    ? []
                    : Array_.groupWhile(
                        records,
                        (a, b) =>
                            Utils.equals(
                                DateGroup.fromDate({ today, time: a.date }),
                                DateGroup.fromDate({ today, time: b.date })
                            )
                    )
                        .map(day => viewRecordsInTimeGroup(day, today))
            )
        ]
    )
}

function viewRecordsInTimeGroup<A, C>(
    day: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
): Layout.Layout<A, C> {
    return Layout.columnWithSpacing(
        30,
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
                        TimeGroup.toSpanishLabel(
                            TimeGroup.fromDate({ today, time: day[0].date })
                        )
                            .toUpperCase()
                    ),
                ]
            ),
            Layout.columnWithSpacing(
                50,
                "div",
                [],
                day.map(record => Record.view(record))
            )
        ]
    )
}


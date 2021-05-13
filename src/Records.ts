import * as Record from './Record'
import * as Update from './Update'


import * as Date from './utils/Date'
import * as Utils from './utils/Utils'
import * as Array_ from './utils/Array'
import * as Maybe from './utils/Maybe'


import * as Layout from './layout/Layout'

import * as Html from './vdom/Html'

import * as Icon from './style/Icon'
import * as Color from './style/Color'

import * as Group from './Group'
import * as Transition from './Transition'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }


export function view<A>(
    records: Array<Record.Record>,
    today: Date.Date,
    collapsedGroups: Array<Group.ByAge>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: Group.ByAge) => A,
): Layout.Layout<A> {
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
                    Group.byAge({ today, time: a.date }),
                    Group.byAge({ today, time: b.date })
                )
        )
            .map(group =>
                viewRecordsInAgeGroup(
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

export function ageGroupTransitionOf(
    group: Group.ByAge,
    collapsedGroups: Array<Group.ByAge>,
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

    if (collapsedGroups.some(x => Utils.equals(x, group))) {
        return { tag: 'collapsed' }
    }

    return { tag: 'uncollapsed' }
}

export function isCollapsed(groupTransition: ViewTransition): boolean {
    return groupTransition.tag === 'collapsed'
}

export function toCssHeight(groupTransition: ViewTransition): string {
    switch (groupTransition.tag) {
        case 'uncollapsed':
        case 'collapsed':
            return 'auto'
        case 'aboutToCollapse':
            return `${groupTransition.height}px`
        case 'collapsing':
            return `0px`
    }
}

export function toOpacity(groupTransition: ViewTransition): number {
    switch (groupTransition.tag) {
        case 'collapsed':
        case 'collapsing':
            return 0
        case 'uncollapsed':
        case 'aboutToCollapse':
            return 1
    }
}

export function toCssRotation(transition: ViewTransition): number {
    switch (transition.tag) {
        case 'uncollapsed':
            return 0
        case 'aboutToCollapse':
        case 'collapsed':
        case 'collapsing':
            return 90
    }
}

export const collapsingTransitionDuration: number = 0.24

function viewRecordsInAgeGroup<A>(
    records: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
    collapsedGroups: Array<Group.ByAge>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: Group.ByAge) => A,
): Layout.Layout<A> {
    const group = Group.byAge({ today, time: records[0].date })
    const groupTransition = ageGroupTransitionOf(group, collapsedGroups, collapsingTransition)

    return Layout.columnWithSpacing(
        20,
        "div",
        [Html.class_("w-full")],
        [
            Layout.rowWithSpacing(
                18,
                "div",
                [
                    Html.class_("w-full"),
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
                            Layout.text(Group.toSpanishLabel(group)),
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
                            Html.style(
                                "transform",
                                `translateY(3px) rotate(${toCssRotation(groupTransition)}deg)`
                            ),
                            Html.style("transition", `transform ${collapsingTransitionDuration}s ease-out`),
                            Html.on("click", () => clickedCollapseButton(group)),
                        ],
                        Icon.chevronDown(),
                    ),
                ]
            ),
            Layout.columnWithSpacing(
                55,
                "div",
                [
                    Html.class_("w-full"),
                    Html.property("id", Group.toStringId(group)),
                    Html.style("overflow", "hidden"),
                    Html.style(
                        "transition",
                        `
                            height ${collapsingTransitionDuration}s ease-out,
                            opacity ${collapsingTransitionDuration}s linear,
                            transform ${collapsingTransitionDuration}s ease-out
                        `
                    ),
                    Html.style("height", toCssHeight(groupTransition)),
                    Html.style("opacity", `${toOpacity(groupTransition)}`),
                ],
                isCollapsed(groupTransition)
                    ? []
                    : Array_.groupWhile(
                        records,
                        (a, b) =>
                            Utils.equals(
                                Group.byDate({ today, time: a.date }),
                                Group.byDate({ today, time: b.date })
                            )
                    )
                        .map(day => viewRecordsInDateGroup(day, today))
            )
        ]
    )
}

function viewRecordsInDateGroup<A>(
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
                        Group.byDateToSpanishLabel(
                            Group.byDate({ today, time: day[0].date })
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


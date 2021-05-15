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
import * as ViewConfig from './ViewConfig'

export type Records =
    { tag: 'Records', array: Array<Record.Record> }


export function view<A>(
    records: Array<Record.Record>,
    today: Date.Date,
    collapsedGroups: Array<Group.ByAge>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: Group.ByAge) => A,
    viewConfig: ViewConfig.ViewConfig,
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
                    viewConfig,
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

    if (groupIsCollapsed(group, collapsedGroups)) {
        return { tag: 'collapsed' }
    }

    return { tag: 'uncollapsed' }
}


export function groupIsCollapsed(group: Group.ByAge, collapsedGroups: Array<Group.ByAge>): boolean {
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

function viewRecordsInAgeGroup<A>(
    records: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
    collapsedGroups: Array<Group.ByAge>,
    collapsingTransition: Transition.Collapsing,
    clickedCollapseButton: (group: Group.ByAge) => A,
    viewConfig: ViewConfig.ViewConfig
): Layout.Layout<A> {
    const group = Group.byAge({ today, time: records[0].date })
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
                    Html.style("color", Color.toCssString(Color.gray400)),
                    Html.style("font-size", "14px"),
                    Html.style("align-items", "baseline"),
                    Html.style("padding", "5px"),
                    Html.style("margin", "-5px"),
                    Html.on("click", () => clickedCollapseButton(group)),
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
                            Html.style("letter-spacing", "2px"),
                            Html.style("font-size", "10px"),
                        ],
                        [
                            Layout.text(Group.toSpanishLabel(group).toUpperCase()),
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
                ]
            ),
            Layout.columnWithSpacing(
                30,
                "div",
                [
                    Html.class_("w-full"),
                    Html.property("id", Group.toStringId(group)),
                    Html.style("overflow", "hidden"),
                    // El overflow:hidden hace que el outline de la última fila se recorte abajo y
                    // a la izquierda. Se corrige con padding:
                    Html.style("padding", "0 0 1px 1px"),
                    Html.style(
                        "transition",
                        `
                            height ${collapsingTransitionSeconds}s ease-out,
                            opacity ${collapsingTransitionSeconds}s linear
                        `
                    ),
                    Html.style("height", toCssHeight(viewTransition)),
                    Html.style("opacity", `${toOpacity(viewTransition)}`),
                ],
                isCollapsed(viewTransition)
                    ? []
                    : Array_.groupWhile(
                        records,
                        (a, b) =>
                            Utils.equals(
                                Group.byDate({ today, time: a.date }),
                                Group.byDate({ today, time: b.date })
                            )
                    )
                        .map(day => viewRecordsInDateGroup(day, today, viewConfig))
            )
        ]
    )
}

function viewRecordsInDateGroup<A>(
    day: [Record.Record, ...Array<Record.Record>],
    today: Date.Date,
    viewConfig: ViewConfig.ViewConfig
): Layout.Layout<A> {
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
                        Group.byDateToSpanishLabel(
                            Group.byDate({ today, time: day[0].date })
                        )
                            .toUpperCase()
                    ),
                ]
            ),
            Layout.columnWithSpacing(
                50,
                "div",
                [],
                day.map(record => Record.view(record, viewConfig))
            )
        ]
    )
}


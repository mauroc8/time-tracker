import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Decoder from './utils/Decoder'
import * as Layout from './layout/Layout'
import * as Html from './vdom/Html'
import * as Date from './utils/Date'
import * as TimeGroup from './TimeGroup'
import * as Record from './Record'
import * as Transition from './Transition'
import * as Array_ from './utils/Array'
import './DateGroup.css'

export type DateGroup = {
    kind: "DateGroup",
    tag: Tag,
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]]
}

function dateGroupOf(
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]],
    today: Date.Date
): DateGroup {
    return {
        kind: "DateGroup",
        tag: fromDate({ today, time: days[0].records[0].date }),
        days,
    }
}

/** Toma un arreglo de `Record`, lo ordena, y clasifica sus elementos
 * según su TimeGroup y según su DateGroup.
*/
export function fromRecords(
    records: Array<Record.Record>,
    today: Date.Date
): Array<DateGroup> {
    return Array_.groupWhile(
        records
            .sort(Record.compare)
            .reverse(),
        (a, b) => 
            Utils.equals(
                fromDate({ today, time: a.date }),
                fromDate({ today, time: b.date })
            )
    )
        .map(recordsInGroup =>
            dateGroupOf(
                TimeGroup.fromRecords(recordsInGroup, today),
                today
            )
        )
}

// --- GROUP TAG

/** A DateGroup.Tag expresses the relationship between today and some other date
 * in a human-comprehensible way:
 * "This week", "Last week", "2 weeks ago", "Last month", and so on.
 */
 export type Tag =
    | { groupTag: "year", year: number }
    | { groupTag: "lastYear" }
    | { groupTag: "month", month: Date.Month }
    | { groupTag: "lastMonth" }
    | { groupTag: "weeksAgo", x: 2 | 3 | 4 }
    | { groupTag: "lastWeek" }
    | { groupTag: "thisWeek" }
    | { groupTag: "nextWeek" }
    | { groupTag: "inTheFuture" }

function of(group: Tag): Tag {
    return group;
}

export const decoder: Decoder.Decoder<Tag> =
    Decoder.andThen(
        Decoder.property("groupTag", Decoder.string),
        groupTag => {
            switch (groupTag) {
                case "inTheFuture":
                case "nextWeek":
                case "thisWeek":
                case "lastWeek":
                case "lastYear":
                case "lastMonth":
                    return Decoder.succeed(of({ groupTag }))
                case "year":
                    return Decoder.map(
                        Decoder.property("year", Decoder.number),
                        year => of({ groupTag, year })
                    )
                case "month":
                    return Decoder.map(
                        Decoder.property("month", Date.monthDecoder),
                        month => of({ groupTag, month })
                    )
                case "weeksAgo":
                    return Decoder.andThen(
                        Decoder.property("x", Decoder.number),
                        x =>
                            x === 2 || x === 3 || x === 4
                                ? Decoder.succeed(of({ groupTag, x }))
                                : Decoder.fail(`Invalid weeksAgo ${x}`)
                    )
                default:
                    return Decoder.fail(`Unknown group tag '${groupTag}'`)
            }
        }
    )

export function toSpanishLabel(group: Tag): string {
    switch (group.groupTag) {
        case "inTheFuture":
            return "En el futuro"
        case "nextWeek":
            return "La semana que viene"
        case "thisWeek":
            return "Esta semana"
        case "lastWeek":
            return "La semana pasada"
        case "weeksAgo":
            return `Hace ${group.x} semanas`
        case "lastMonth":
            return "El mes pasado"
        case "month":
            return Date.monthToSpanishLabel(group.month)
        case "lastYear":
            return "El año pasado"
        case "year":
            return String(group.year)
        default:
            const _: never = group
            return "Nunca"
    }
}

export function toStringId(group: Tag): string {
 switch (group.groupTag) {
     case "inTheFuture":
         return "inTheFuture"
     case "nextWeek":
         return "nextWeek"
     case "thisWeek":
         return "thisWeek"
     case "lastWeek":
         return "lastWeek"
     case "weeksAgo":
         return `weeksAgo-${group.x}`
     case "lastMonth":
         return "lastMonth"
     case "month":
         return `month-${group.month}`
     case "lastYear":
         return "lastYear"
     case "year":
         return `year-${String(group.year)}`
     default:
         const _: never = group
         return "never"
 }
}

export function fromDate(args: { today: Date.Date, time: Date.Date }): Tag {
 const { today, time } = args

 if (time.year > today.year) {
     return { groupTag: "inTheFuture" }
 } else if (time.year === today.year) {
    if (time.month > today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: "nextWeek" }
        } else {
            return { groupTag: "inTheFuture" }
        }
    } else if (time.month === today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: "nextWeek" }
        } else if (Date.isoWeek(time) === Date.isoWeek(today)) {
            return { groupTag: "thisWeek" }
        } else if (Date.isoWeek(time) === Date.isoWeek(today) - 1) {
            return { groupTag: "lastWeek" }
        } else {
            return {
                groupTag: "weeksAgo",
                x: Date.isoWeek(today) - Date.isoWeek(time) as 2 | 3 | 4
            }
        }
    } else if (time.month === today.month - 1) {
        return { groupTag: "lastMonth" }
    } else {
        return {
            groupTag: "month",
            month: time.month
        }
    }
 } else if (time.year === today.year - 1) {
     return { groupTag: "lastYear" }
 } else {
     return { groupTag: "year", year: time.year }
 }
}


// --- VIEW

export type CollapsingState =
    | { tag: "uncollapsed" }
    | { tag: "aboutToCollapse", height: number }
    | { tag: "collapsing" }
    | { tag: "collapsed" }

export function getCollapsingState(
    groupTag: Tag,
    collapsedGroups: Array<Tag>,
    collapsingTransition: Transition.Collapsing,
): CollapsingState {
    switch (collapsingTransition.tag) {
        case 'aboutToCollapse':
            if (Utils.equals(collapsingTransition.group, groupTag)) {
                return { tag: 'aboutToCollapse', height: collapsingTransition.height }
            }
            break;
        case 'collapsing':
            if (Utils.equals(collapsingTransition.group, groupTag)) {
                return { tag: 'collapsing' }
            }
            break;
        case 'idle':
            break;
        default:
            Utils.assertNever(collapsingTransition)
            break;
    }

    if (collapsedGroups.some(Utils.eq(groupTag))) {
        return { tag: 'collapsed' }
    }

    return { tag: 'uncollapsed' }
}

function isCollapsed(viewTransition: CollapsingState): boolean {
    return viewTransition.tag === 'collapsed'
}

function toCssHeight(viewTransition: CollapsingState): string {
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

function toOpacity(viewTransition: CollapsingState): number {
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

export function view<E, C>(
    groupTag: Tag,
    records: Array<Record.Record>,
    collapsingState: CollapsingState,
    clickedCollapseButton: (group: Tag) => E,
    today: Date.Date,
): Layout.Layout<E, C> {
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
                    Html.on("click", () => clickedCollapseButton(groupTag)),
                    Html.attribute("aria-controls", toStringId(groupTag)),
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
                            Layout.text(toSpanishLabel(groupTag).toUpperCase()),
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
                    Html.property("id", toStringId(groupTag)),
                    Html.style(
                        "overflow",
                        collapsingState.tag === 'uncollapsed'
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
                    Html.style("height", toCssHeight(collapsingState)),
                    Html.style("opacity", `${toOpacity(collapsingState)}`),
                    Html.attribute("aria-expanded", String(!isCollapsed(collapsingState))),
                ],
                isCollapsed(collapsingState)
                    ? []
                    : Array_.groupWhile(
                        records,
                        (a, b) =>
                            Utils.equals(
                                fromDate({ today, time: a.date }),
                                fromDate({ today, time: b.date })
                            )
                    )
                        .map(day => 
                            TimeGroup.view(TimeGroup.fromDate({ today, time: day[0].date }), day)
                        )
            )
        ]
    )
}

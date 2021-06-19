import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Decoder from './utils/Decoder'
import * as Layout from './layout/Layout'
import * as Html from './vdom/Html'
import * as Date from './utils/Date'
import * as TimeGroup from './TimeGroup'
import * as Record from './Record'
import * as Array_ from './utils/Array'
import * as Update from './Update'
import * as Task from './utils/Task'
import * as Pair from './utils/Pair'
import './DateGroup.css'

const collapsingTransitionSeconds = 0.26

type Transition =
    | { tag: 'idle' }
    | { tag: 'aboutToCollapse', groupTag: Tag, height: number }
    | { tag: 'collapsing', groupTag: Tag }

function transitionDecoder(): Decoder.Decoder<Transition> {
    return Decoder.union3(
        Decoder.object(
            'tag', Decoder.literal('idle')
        ),
        Decoder.object3(
            'tag', Decoder.literal('aboutToCollapse'),
            'groupTag', groupTagDecoder(),
            'height', Decoder.number,
        ),
        Decoder.object2(
            'tag', Decoder.literal('collapsing'),
            'groupTag', groupTagDecoder(),
        ),
    )
}

function idle(): Transition {
    return { tag: 'idle' }
}

function aboutToCollapse(group: Tag, height: number): Transition {
    return { tag: 'aboutToCollapse', groupTag: group, height }
}

function collapsing(tag: Tag): Transition {
    return { tag: 'collapsing', groupTag: tag }
}

function startCollapsing(collapsingCollapseTransitionState: Transition): Transition {
    switch (collapsingCollapseTransitionState.tag) {
        case 'idle':
        case 'collapsing':
            return collapsingCollapseTransitionState

        case 'aboutToCollapse':
            return collapsing(collapsingCollapseTransitionState.groupTag)
    }
}

// --- State

// The state needed to make a transition when a group collapses.
// It is needed in order to create a DateGroup.ViewConfig.

export type State = {
    transition: Transition,
    collapsedGroups: Array<Tag>,
}

export const decoder: Decoder.Decoder<State> =
    Decoder.object2(
        'transition', transitionDecoder(),
        'collapsedGroups', Decoder.array(groupTagDecoder()),
    )

function stateOf(state: State): State {
    return state
}

export function init(): State {
    return {
        transition: idle(),
        collapsedGroups: [],
    }
}

export type Event =
    | { tag: 'clickedCollapseButton', groupTag: Tag }
    | { tag: 'gotHeightOfGroupBeingCollapsed', groupTag: Tag, height: number }
    | { tag: 'startCollapseTransition' }
    | { tag: 'endCollapseTransition' }
    | { tag: 'domError' }

function eventOf(event: Event): Event {
    return event
}

function clickedCollapseButton(groupTag: Tag): Event {
    return { tag: 'clickedCollapseButton', groupTag }
}

export function update(state: State, event: Event): Update.Update<State, Event> {
    switch (event.tag) {
        case 'domError':
            // Ignoro
            return Update.pure(state)

        case 'clickedCollapseButton':
            if (state.collapsedGroups.some(Utils.eq(event.groupTag))) {
                return Update.pure({
                    transition: state.transition,
                    collapsedGroups: state.collapsedGroups
                        .filter(group => !Utils.equals(group, event.groupTag)),
                })
            }

            return Update.of(
                state,
                [
                    getHeightOfGroup(
                        event.groupTag,
                        height =>
                            eventOf({
                                tag: 'gotHeightOfGroupBeingCollapsed',
                                groupTag: event.groupTag,
                                height
                            }),
                            eventOf({ tag: 'domError' })
                    )
                ]
            )

        case 'gotHeightOfGroupBeingCollapsed':
            return Update.of(
                stateOf({
                    collapsedGroups: [...state.collapsedGroups, event.groupTag],
                    transition: aboutToCollapse(event.groupTag, event.height)
                }),
                [
                    Task.map(
                        Task.waitMilliseconds(0),
                        _ => eventOf({ tag: 'startCollapseTransition' })
                    )
                ]
            )

        case 'startCollapseTransition':
            return Update.of(
                stateOf({
                    collapsedGroups: state.collapsedGroups,
                    transition: startCollapsing(state.transition)
                }),
                [
                    Task.map(
                        Task.waitMilliseconds(collapsingTransitionSeconds * 1000),
                        _ => eventOf({ tag: 'endCollapseTransition' })
                    )
                ]
            )

        case 'endCollapseTransition':
            return Update.pure({
                collapsedGroups: state.collapsedGroups,
                transition: idle()
            })
    }
}

function getHeightOfGroup<A>(
    group: Tag,
    onHeight: (height: number) => A,
    onError: A
): Task.Task<A> {
    return Task.map(
        Task.getRectOf(toStringId(group)),
        maybeRect =>
            maybeRect
                .map(rect => onHeight(rect.height))
                .withDefault(onError)
    )
}

// --- DATE GROUP

export type DateGroup = {
    kind: 'DateGroup',
    tag: Tag,
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]]
}

function dateGroupOf(
    days: [TimeGroup.TimeGroup, ...TimeGroup.TimeGroup[]],
    today: Date.Date
): DateGroup {
    return {
        kind: 'DateGroup',
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
 * 'This week', 'Last week', '2 weeks ago', 'Last month', and so on.
 */
 export type Tag =
    | { groupTag: 'year', year: number }
    | { groupTag: 'lastYear' }
    | { groupTag: 'month', month: Date.Month }
    | { groupTag: 'lastMonth' }
    | { groupTag: 'weeksAgo', x: 2 | 3 | 4 }
    | { groupTag: 'lastWeek' }
    | { groupTag: 'thisWeek' }
    | { groupTag: 'nextWeek' }
    | { groupTag: 'inTheFuture' }

function tagOf(group: Tag): Tag {
    return group
}

function groupTagDecoder(): Decoder.Decoder<Tag> {
    return Decoder.union9(
        Decoder.object2(
            'groupTag', Decoder.literal('year'),
            'year', Decoder.number,
        ),
        Decoder.object(
            'groupTag', Decoder.literal('lastYear'),
        ),
        Decoder.object2(
            'groupTag', Decoder.literal('month'),
            'month', Date.monthDecoder,
        ),
        Decoder.object(
            'groupTag', Decoder.literal('lastMonth'),
        ),
        Decoder.object2(
            'groupTag', Decoder.literal('weeksAgo'),
            'x', Decoder.andThen(
                Decoder.number,
                n => n === 2 || n === 3 || n === 4
                    ? Decoder.succeed<2 | 3 | 4>(n)
                    : Decoder.fail<2 | 3 | 4>('Invalid weeks ago')
            )
        ),
        Decoder.object(
            'groupTag', Decoder.literal('lastWeek'),
        ),
        Decoder.object(
            'groupTag', Decoder.literal('thisWeek'),
        ),
        Decoder.object(
            'groupTag', Decoder.literal('nextWeek'),
        ),
        Decoder.object(
            'groupTag', Decoder.literal('inTheFuture'),
        ),
    )
}

function groupTagDecoderOld(): Decoder.Decoder<Tag> {
    return Decoder.andThen(
        Decoder.property('groupTag', Decoder.string),
        groupTag => {
            switch (groupTag) {
                case 'inTheFuture':
                case 'nextWeek':
                case 'thisWeek':
                case 'lastWeek':
                case 'lastYear':
                case 'lastMonth':
                    return Decoder.succeed(tagOf({ groupTag }))
                case 'year':
                    return Decoder.map(
                        Decoder.property('year', Decoder.number),
                        year => tagOf({ groupTag, year })
                    )
                case 'month':
                    return Decoder.map(
                        Decoder.property('month', Date.monthDecoder),
                        month => tagOf({ groupTag, month })
                    )
                case 'weeksAgo':
                    return Decoder.andThen(
                        Decoder.property('x', Decoder.number),
                        x =>
                            x === 2 || x === 3 || x === 4
                                ? Decoder.succeed(tagOf({ groupTag, x }))
                                : Decoder.fail(`Invalid weeksAgo ${x}`)
                    )
                default:
                    return Decoder.fail(`Unknown group tag '${groupTag}'`)
            }
        }
    )
}

export function toSpanishLabel(group: Tag): string {
    switch (group.groupTag) {
        case 'inTheFuture':
            return 'En el futuro'
        case 'nextWeek':
            return 'La semana que viene'
        case 'thisWeek':
            return 'Esta semana'
        case 'lastWeek':
            return 'La semana pasada'
        case 'weeksAgo':
            return `Hace ${group.x} semanas`
        case 'lastMonth':
            return 'El mes pasado'
        case 'month':
            return Date.monthToSpanishLabel(group.month)
        case 'lastYear':
            return 'El año pasado'
        case 'year':
            return String(group.year)
        default:
            const _: never = group
            return 'Nunca'
    }
}

export function toStringId(group: Tag): string {
 switch (group.groupTag) {
     case 'inTheFuture':
         return 'inTheFuture'
     case 'nextWeek':
         return 'nextWeek'
     case 'thisWeek':
         return 'thisWeek'
     case 'lastWeek':
         return 'lastWeek'
     case 'weeksAgo':
         return `weeksAgo-${group.x}`
     case 'lastMonth':
         return 'lastMonth'
     case 'month':
         return `month-${group.month}`
     case 'lastYear':
         return 'lastYear'
     case 'year':
         return `year-${String(group.year)}`
     default:
         const _: never = group
         return 'never'
 }
}

export function fromDate(args: { today: Date.Date, time: Date.Date }): Tag {
 const { today, time } = args

 if (time.year > today.year) {
     return { groupTag: 'inTheFuture' }
 } else if (time.year === today.year) {
    if (time.month > today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: 'nextWeek' }
        } else {
            return { groupTag: 'inTheFuture' }
        }
    } else if (time.month === today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { groupTag: 'nextWeek' }
        } else if (Date.isoWeek(time) === Date.isoWeek(today)) {
            return { groupTag: 'thisWeek' }
        } else if (Date.isoWeek(time) === Date.isoWeek(today) - 1) {
            return { groupTag: 'lastWeek' }
        } else {
            return {
                groupTag: 'weeksAgo',
                x: Date.isoWeek(today) - Date.isoWeek(time) as 2 | 3 | 4
            }
        }
    } else if (time.month === today.month - 1) {
        return { groupTag: 'lastMonth' }
    } else {
        return {
            groupTag: 'month',
            month: time.month
        }
    }
 } else if (time.year === today.year - 1) {
     return { groupTag: 'lastYear' }
 } else {
     return { groupTag: 'year', year: time.year }
 }
}


// --- VIEW

type ViewStatus =
    | { tag: 'uncollapsed' }
    | { tag: 'aboutToCollapse', height: number }
    | { tag: 'collapsing' }
    | { tag: 'collapsed' }


export function getViewStatus(
    groupTag: Tag,
    state: State,
): ViewStatus {
    switch (state.transition.tag) {
        case 'aboutToCollapse':
            if (Utils.equals(state.transition.groupTag, groupTag)) {
                return { tag: 'aboutToCollapse', height: state.transition.height }
            }
            break
        case 'collapsing':
            if (Utils.equals(state.transition.groupTag, groupTag)) {
                return { tag: 'collapsing' }
            }
            break
        case 'idle':
            break
        default:
            Utils.assertNever(state.transition)
            break
    }

    if (state.collapsedGroups.some(Utils.eq(groupTag))) {
        return { tag: 'collapsed' }
    }

    return { tag: 'uncollapsed' }
}
    

function isCollapsed(viewCollapseTransitionState: ViewStatus): boolean {
    return viewCollapseTransitionState.tag === 'collapsed'
}

function toCssHeight(viewCollapseTransitionState: ViewStatus): string {
    switch (viewCollapseTransitionState.tag) {
        case 'uncollapsed':
        case 'collapsed':
            return 'auto'
        case 'aboutToCollapse':
            return `${viewCollapseTransitionState.height}px`
        case 'collapsing':
            return `0px`
    }
}

function toOpacity(viewCollapseTransitionState: ViewStatus): number {
    switch (viewCollapseTransitionState.tag) {
        case 'collapsed':
        case 'collapsing':
            return 0
        case 'uncollapsed':
        case 'aboutToCollapse':
            return 1
    }
}
    
export const collapseTransitionDuration: number = 0.24

export function view<Context extends { today: Date.Date }>(
    groupTag: Tag,
    records: Array<Record.Record>,
    state: State,
): Layout.Layout<Event, Context> {
    const viewStatus = getViewStatus(groupTag, state)

    return Layout.usingContext(({ today }) =>
        Layout.column(
            'div',
            [
                Layout.spacing(30),
                Layout.fullWidth()
            ],
            [
                Layout.row(
                    'button',
                    [
                        Layout.spacing(10),
                        Layout.fullWidth(),
                        Html.class_('date-group-collapse-button'),
                        Html.style('padding', '5px'),
                        Html.style('margin', '-5px'),
                        Html.on('click', () => clickedCollapseButton(groupTag)),
                        Html.attribute('aria-controls', toStringId(groupTag)),
                    ],
                    [
                        Layout.inlineText(toSpanishLabel(groupTag).toUpperCase()),
                    ]
                ),
                Layout.column(
                    'div',
                    [
                        Layout.spacing(30),
                        Layout.fullWidth(),
                        Html.property('id', toStringId(groupTag)),
                        Html.style(
                            'overflow',
                            viewStatus.tag === 'uncollapsed'
                                ? 'visible'
                                : 'hidden'
                        ),
                        Html.style(
                            'transition',
                            `height ${collapseTransitionDuration}s ease-out, opacity ${collapseTransitionDuration}s linear`
                        ),
                        Html.style('height', toCssHeight(viewStatus)),
                        Html.style('opacity', `${toOpacity(viewStatus)}`),
                        Html.attribute('aria-expanded', String(!isCollapsed(viewStatus))),
                    ],
                    isCollapsed(viewStatus)
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
    )
}

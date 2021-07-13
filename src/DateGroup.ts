import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Decoder from './utils/Decoder'
import * as Layout from './layout/Layout'
import * as Css from './layout/Css'
import * as Html from './vdom/Html'
import * as Date from './utils/Date'
import * as TimeGroup from './TimeGroup'
import * as Record from './Record'
import * as Array_ from './utils/Array'
import * as Update from './utils/Update'
import * as Task from './utils/Task'
import * as Codec from './utils/Codec'
import * as Color from './style/Color'

const collapsingTransitionSeconds = 0.26

type Transition =
    | { tag: 'idle' }
    | { tag: 'aboutToCollapse', id: Id, height: number }
    | { tag: 'collapsing', id: Id }


function idle(): Transition {
    return { tag: 'idle' }
}

function aboutToCollapse(id: Id, height: number): Transition {
    return { tag: 'aboutToCollapse', id, height }
}

function collapsing(tag: Id): Transition {
    return { tag: 'collapsing', id: tag }
}

function startCollapsing(collapsingCollapseTransitionState: Transition): Transition {
    switch (collapsingCollapseTransitionState.tag) {
        case 'idle':
        case 'collapsing':
            return collapsingCollapseTransitionState

        case 'aboutToCollapse':
            return collapsing(collapsingCollapseTransitionState.id)
    }
}

// --- State

// The state needed to make a transition when a group collapses.
// It is needed in order to create a DateGroup.ViewConfig.

export type State = {
    transition: Transition,
    collapsedGroups: Array<Id>,
}

export const codec: Codec.Codec<State> = Codec.struct({
    collapsedGroups: Codec.array(idCodec())
})
    .map(
        (state) => ({ ...state, transition: idle() }),
        Utils.id
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
    | { tag: 'clickedCollapseButton', id: Id }
    | { tag: 'gotHeightOfGroupBeingCollapsed', id: Id, height: number }
    | { tag: 'startCollapseTransition' }
    | { tag: 'endCollapseTransition' }
    | { tag: 'domError' }

function clickedCollapseButton(id: Id): Event {
    return { tag: 'clickedCollapseButton', id }
}

function gotHeightOfGroupBeingCollapsed(id: Id, height: number): Event {
    return { tag: 'gotHeightOfGroupBeingCollapsed', id, height }
}

function startCollapseTransition(): Event {
    return { tag: 'startCollapseTransition' }
}

function endCollapseTransition(): Event {
    return { tag: 'endCollapseTransition' }
}

function domError(): Event {
    return { tag: 'domError' }
}

export function update(state: State, event: Event): Update.Update<State, Event> {
    switch (event.tag) {
        case 'domError':
            // Ignore.
            return Update.pure(state)

        case 'clickedCollapseButton':
            if (state.collapsedGroups.some(Utils.eq(event.id))) {
                return Update.pure({
                    transition: state.transition,
                    collapsedGroups: state.collapsedGroups
                        .filter(group => !Utils.equals(group, event.id)),
                })
            }

            return Update.of(
                state,
                [
                    getHeightOfGroup(
                        event.id,
                        height => gotHeightOfGroupBeingCollapsed(event.id, height),
                        domError()
                    )
                ]
            )

        case 'gotHeightOfGroupBeingCollapsed':
            return Update.of(
                stateOf({
                    collapsedGroups: [...state.collapsedGroups, event.id],
                    transition: aboutToCollapse(event.id, event.height)
                }),
                [
                    Task.waitMilliseconds(_ => startCollapseTransition(), 0),
                ]
            )

        case 'startCollapseTransition':
            return Update.of(
                stateOf({
                    collapsedGroups: state.collapsedGroups,
                    transition: startCollapsing(state.transition)
                }),
                [
                    Task.waitMilliseconds(
                        _ => endCollapseTransition(),
                        collapsingTransitionSeconds * 1000,
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
    group: Id,
    onHeight: (height: number) => A,
    onError: A
): Task.Task<A> {
    return Task.map(
        Task.getRectOf(idToString(group)),
        maybeRect =>
            maybeRect
                .map(rect => onHeight(rect.height))
                .withDefault(onError)
    )
}

// --- DATE GROUP

export type DateGroup = {
    kind: 'DateGroup',
    tag: Id,
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

// --- GROUP ID

/** A DateGroup.Id expresses the relationship between today and some other date
 * in a human-comprehensible way:
 * 'This week', 'Last week', '2 weeks ago', 'Last month', and so on.
 * 
 * It is an 'ID' because the DateGroup is just the array of records that have that particular ID.
 */
 export type Id =
    | { tag: 'year', year: number }
    | { tag: 'lastYear' }
    | { tag: 'month', month: Date.Month }
    | { tag: 'lastMonth' }
    | { tag: 'weeksAgo', x: 2 | 3 | 4 }
    | { tag: 'lastWeek' }
    | { tag: 'thisWeek' }
    | { tag: 'nextWeek' }
    | { tag: 'inTheFuture' }

function twoThreeOrFourCodec(): Codec.Codec<2 | 3 | 4> {
    return Codec.union({
        0: [
            x => x === 2 ? x : null,
            Codec.literal(2)
        ],
        1: [
            x => x === 3 ? x : null,
            Codec.literal(3)
        ],
        2: [
            x => x === 4 ? x : null,
            Codec.literal(4)
        ],
    })
}

function idCodec(): Codec.Codec<Id> {
    return Codec.union({
        0: [
            x => x.tag === 'year' ? x : null,
            Codec.struct({ tag: Codec.literal('year'), year: Codec.number })
        ],
        1: [
            x => x.tag === 'lastYear' ? x : null,
            Codec.struct({ tag: Codec.literal('lastYear') })
        ],
        2: [
            x => x.tag === 'month' ? x : null,
            Codec.struct({ tag: Codec.literal('month'), month: Date.monthCodec() })
        ],
        3: [
            x => x.tag === 'lastMonth' ? x : null,
            Codec.struct({ tag: Codec.literal('lastMonth') })
        ],
        4: [
            x => x.tag === 'weeksAgo' ? x : null,
            Codec.struct({ tag: Codec.literal('weeksAgo'), x: twoThreeOrFourCodec() })
        ],
        5: [
            x => x.tag === 'lastWeek' ? x : null,
            Codec.struct({ tag: Codec.literal('lastWeek') })
        ],
        6: [
            x => x.tag === 'thisWeek' ? x : null,
            Codec.struct({ tag: Codec.literal('thisWeek') })
        ],
        7: [
            x => x.tag === 'nextWeek' ? x : null,
            Codec.struct({ tag: Codec.literal('nextWeek') })
        ],
        8: [
            x => x.tag === 'inTheFuture' ? x : null,
            Codec.struct({ tag: Codec.literal('inTheFuture') })
        ],
    })
}

export function toSpanishLabel(group: Id): string {
    switch (group.tag) {
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

export function idToString(group: Id): string {
 switch (group.tag) {
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

export function fromDate(args: { today: Date.Date, time: Date.Date }): Id {
 const { today, time } = args

 if (time.year > today.year) {
     return { tag: 'inTheFuture' }
 } else if (time.year === today.year) {
    if (time.month > today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { tag: 'nextWeek' }
        } else {
            return { tag: 'inTheFuture' }
        }
    } else if (time.month === today.month) {
        if (Date.isoWeek(time) === Date.isoWeek(today) + 1) {
            return { tag: 'nextWeek' }
        } else if (Date.isoWeek(time) === Date.isoWeek(today)) {
            return { tag: 'thisWeek' }
        } else if (Date.isoWeek(time) === Date.isoWeek(today) - 1) {
            return { tag: 'lastWeek' }
        } else {
            return {
                tag: 'weeksAgo',
                x: Date.isoWeek(today) - Date.isoWeek(time) as 2 | 3 | 4
            }
        }
    } else if (time.month === today.month - 1) {
        return { tag: 'lastMonth' }
    } else {
        return {
            tag: 'month',
            month: time.month
        }
    }
 } else if (time.year === today.year - 1) {
     return { tag: 'lastYear' }
 } else {
     return { tag: 'year', year: time.year }
 }
}


// --- VIEW

type ViewStatus =
    | { tag: 'uncollapsed' }
    | { tag: 'aboutToCollapse', height: number }
    | { tag: 'collapsing' }
    | { tag: 'collapsed' }


export function getViewStatus(
    id: Id,
    state: State,
): ViewStatus {
    switch (state.transition.tag) {
        case 'aboutToCollapse':
            if (Utils.equals(state.transition.id, id)) {
                return { tag: 'aboutToCollapse', height: state.transition.height }
            }
            break
        case 'collapsing':
            if (Utils.equals(state.transition.id, id)) {
                return { tag: 'collapsing' }
            }
            break
        case 'idle':
            break
        default:
            Utils.assertNever(state.transition)
            break
    }

    if (state.collapsedGroups.some(Utils.eq(id))) {
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

export const css: Css.Css<'date-group-collapse-button'> = Css.css(
    {
        selector: Css.Selectors.class_('date-group-collapse-button'),
        properties: [
            ['font-size', '12px'],
            ['transition', 'opacity 0.2s ease-out'],
            ['opacity', '0.5'],
            ['padding', '5px'],
            ['margin', '-5px'],
            ['letter-spacing', '0.15em'],
        ],
    },
    {
        selector: Css.Selectors.class_('date-group-collapse-button', 'hover'),
        properties: [
            ['opacity', '0.75'],
        ],
    },
    {
        selector: Css.Selectors.class_('date-group-collapse-button', 'focus'),
        properties: [
            ['opacity', '1'],
            ['outline', '0'],
        ],
    },
)

export function view<E, Context extends { today: Date.Date }>(
    id: Id,
    records: Array<Record.Record>,
    state: State,
    config: {
        onGroupEvent: (evt: Event) => E,
        onChange: (id: Record.Id, input: Record.InputName, value: string) => E,
        onInput: (id: Record.Id, input: Record.InputName, value: string) => E,
        onPlay: (id: Record.Id) => E,
        onDelete: (id: Record.Id) => E,
    },
): Layout.Layout<E, Context> {
    const viewStatus = getViewStatus(id, state)

    return Layout.column(
        'div',
        [
            Layout.spacing(Record.spacing / 2),
            Layout.fullWidth()
        ],
        [
            Layout.row(
                'button',
                [
                    Layout.spacing(10),
                    Layout.fullWidth(),
                    Layout.baselineY(),
                    Html.class_('date-group-collapse-button'),
                    Html.on('click', () => config.onGroupEvent(clickedCollapseButton(id))),
                    Html.attribute('aria-controls', idToString(id)),
                ],
                [
                    Layout.column(
                        'div',
                        [
                            Layout.grow(1),
                            Layout.heightPx(1),
                            Layout.horizontalGradient(Color.transparent, Color.hsl(0, 0, 0.2))
                        ],
                        []
                    ),
                    Layout.inlineText(toSpanishLabel(id).toUpperCase()),
                    Layout.column(
                        'div',
                        [
                            Layout.grow(1),
                            Layout.heightPx(1),
                            Layout.horizontalGradient(Color.hsl(0, 0, 0.2), Color.transparent)
                        ],
                        []
                    ),
                ]
            ),
            Layout.withContext(({ today }) =>
                Layout.column(
                    'div',
                    [
                        Layout.spacing(Record.spacing),
                        Layout.fullWidth(),
                        Html.property('id', idToString(id)),
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
                                    TimeGroup.fromDate({ today, time: a.date }),
                                    TimeGroup.fromDate({ today, time: b.date })
                                )
                        )
                            .map(day => 
                                TimeGroup.view(
                                    TimeGroup.fromDate({ today, time: day[0].date }),
                                    day,
                                    config,
                                )
                            )
                )
            )
        ]
    )
}

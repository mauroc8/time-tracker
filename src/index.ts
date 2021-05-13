/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as Update from './Update'
import * as Record from './Record'
import * as Records from './Records'
import * as CreateRecord from './CreateRecord'

import * as Html from './vdom/Html'
import * as VirtualDom from './vdom/VirtualDom'

import * as Layout from './layout/Layout'
import * as Css from './layout/Css'

import * as Color from './style/Color'
import * as  Component from './style/Component'

import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Cmd from './utils/Cmd'

import * as Decoder from './utils/Decoder'

import * as Utils from './utils/Utils'
import * as Maybe from './utils/Maybe'

import * as Group from './Group'
import * as Transition from './Transition'

// STATE ---

/** The whole state of the application.
*/
export type State = {
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    today: Date.Date,
    collapsedGroups: Array<Group.ByAge>,
    collapsingTransition: Transition.Collapsing,
}

export function stateOf(state: State): State {
    return state
}

export function initialState(
    storedState: string | null,
    today: Date.Date,
    now: Time.Time
): Update.Update<State, Event> {
    try {
        return Update.of(
            Decoder
                .decode(
                    storedState && JSON.parse(storedState),
                    decoder(today)
                )
                .withDefault(newInitialState(today)),
            waitTilTomorrow(now)
        )
    } catch (e) {
        return Update.of(
            newInitialState(today),
            waitTilTomorrow(now)
        )
    }
}

/** Espera hasta la medianoche para actualizar el `today` */
function waitTilTomorrow(now: Time.Time): Cmd.Cmd<Event> {
    return Cmd.map(
        Cmd.waitMilliseconds(Time.minutesBeforeMidnight(now) * 60 * 1000),
        (date) => eventOf({ event: "gotNewDate", date })
    )
}

function newInitialState(today: Date.Date): State {
    return {
        createRecord: CreateRecord.empty(""),
        records: [
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
        ],
        today,
        collapsedGroups: [],
        collapsingTransition: Transition.collapsingIdle(),
    }
}

export function decoder(today: Date.Date): Decoder.Decoder<State> {
    return Decoder.map3(
        Decoder.property('records', Decoder.array(Record.decoder)),
        Decoder.property('createRecord', CreateRecord.decoder),
        Decoder.property(
            'collapsedGroups',
            Decoder.array(Group.decoder)
        ),
        (records, createRecord, collapsedGroups) =>
            stateOf({
                records,
                createRecord,
                today,
                collapsedGroups,
                collapsingTransition: Transition.collapsingIdle(),
            })
    )
}

function groupIsCollapsed(group: Group.ByAge, state: State): boolean {
    return state.collapsedGroups.some(x => Utils.equals(x, group))
}

// --- UPDATE

/** The type of the dispatch function
 */
 export type Dispatch = (event: Event) => void

 /** Event is what's typically called an "action" in Redux
 */
 export type Event =
     | { event: "none" }
     | { event: "gotNewDate", date: globalThis.Date }
     | { event: "clickedCollapseButton", group: Group.ByAge }
     // Collapse transition
     | { event: "gotHeightOfGroupBeingCollapsed", group: Group.ByAge, height: number }
     | { event: "startCollapseTransition" }
     | { event: "endCollapseTransition" }

export function eventOf(event: Event): Event {
    return event;
}

function update(state: State, event: Event): Update.Update<State, Event> {
    switch (event.event) {
        case "none":
            return Update.pure(state)

        case "gotNewDate":
            return Update.of(
                stateOf({ ...state, today: Date.fromJavascriptDate(event.date) }),
                waitTilTomorrow(Time.fromJavascriptDate(event.date))
            )

        case "clickedCollapseButton":
            if (groupIsCollapsed(event.group, state)) {
                return Update.pure({
                    ...state,
                    collapsedGroups: state.collapsedGroups.filter(group => !Utils.equals(group, event.group)),
                })
            }
            return Update.of(
                state,
                Cmd.map(
                    Cmd.getRectOf(Group.toStringId(event.group)),
                    maybeRect =>
                        maybeRect
                            .map(rect =>
                                eventOf({
                                    event: "gotHeightOfGroupBeingCollapsed",
                                    group: event.group,
                                    height: rect.height
                                })
                            )
                            .withDefault(eventOf({ event: "none" }))
                )
            )

        // --- Collapse transition

        case "gotHeightOfGroupBeingCollapsed":
            return Update.of(
                stateOf({
                    ...state,
                    collapsedGroups: [...state.collapsedGroups, event.group],
                    collapsingTransition: Transition.aboutToCollapse(event.group, event.height)
                }),
                Cmd.map(
                    Cmd.waitMilliseconds(0),
                    _ => eventOf({ event: "startCollapseTransition" })
                )
            )

        case "startCollapseTransition":
            return Update.of(
                stateOf({
                    ...state,
                    collapsingTransition: Transition.startCollapsing(state.collapsingTransition)
                }),
                Cmd.map(
                    Cmd.waitMilliseconds(Records.collapsingTransitionDuration * 1000),
                    _ => eventOf({ event: "endCollapseTransition" })
                )
            )

        case "endCollapseTransition":
            return Update.pure({
                ...state,
                collapsingTransition: Transition.collapsingIdle()
            })

    }
}


// --- VIEW

const globalCss: Css.Css = {
    "*": {
        "margin": "0",
        "padding": "0",
        "text": "inherit",
        "box-sizing": "inherit",
        "text-decoration": "inherit",
        "font-weight": "inherit",
        "font-size": "inherit",
        "background": "transparent",
        "border": "0",
        "transition": "all 0.2s ease-out",
        "color": "inherit",
        "text-align": "inherit",
        "outline-color": "transparent",
    },
    "button, summary": { "cursor": "pointer" },
    "*:focus": { "outline": "1px dashed rgba(255, 255, 255, 0.15)" },
    "html": { "box-sizing": "border-box", "line-height": "1" },
    "body": {
        "background-color": Color.toCssString(Color.background),
        "font-family": "Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir "
            + " helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif",
        "border-top": `6px solid ${Color.toCssString(Color.accent)}`,
        "color": Color.toCssString(Color.gray700)
    },
    ".w-full": { "width": "100%" },
    ".flex-grow": { "flex-grow": "1" },
}

export function view(state: State): Html.Html<Event> {
    return Layout.toHtml(
        "div",
        [
            Html.style("display", "flex"),
            Html.style("flex-direction", "column"),
            Html.style("align-items", "center"),
        ],
        Layout.withCss(
            globalCss,
            Layout.column(
                "div",
                [
                    Html.class_("w-full"),
                    Html.style("max-width", (1024 + 40) + "px"),
                    Html.paddingXY(0, 20),
                ],
                [
                    Layout.space(50),
                    /*CreateRecord.view(
                        [
                            Html.padding(10),
                        ],
                        {
                            createRecord: state.createRecord,
                            records: state.records,
                        }
                    ),*/
                    Records.view(
                        state.records,
                        state.today,
                        state.collapsedGroups,
                        state.collapsingTransition,
                        group => eventOf({ event: "clickedCollapseButton", group }),
                    ),
                ]
            )
        )
    )
}

// --- MAIN


let $rootElement = document.getElementById('root') as Element | Text

/** Flags refer to some external state that is passed to app initialization */
const storedState = localStorage.getItem("state")

if ($rootElement !== null) {
    const init = initialState(
        storedState,
        Date.fromJavascriptDate(new window.Date()),
        Time.fromJavascriptDate(new window.Date())
    )

    let currentState = init.state;

    requestAnimationFrame(() => {
        init.cmd.execute(dispatch)
    })

    let currentView = view(currentState)

    const dispatch = (event: Event) => {
        const { state: newState, cmd } = update(currentState, event)

        const newView = view(newState)
        const patch = VirtualDom.diff(currentView, newView, dispatch)

        try {
            patch($rootElement)
            currentState = newState
            currentView = newView
            // El comando se ejecuta sincrónicamente, pero las llamadas a "dispatch"
            // dentro del comando se ejecutan en el siguiente frame.
            cmd.execute(waitAFrameAndDispatch)
        } catch (e) {
            console.error(e)
        }
    }

    function waitAFrameAndDispatch(event: Event) {
        requestAnimationFrame(() => dispatch(event))
    }

    const $initialRender = Html.toElement(currentView, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender
}

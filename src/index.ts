/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as Update from './Update'
import * as Record from './Record'
import * as Records from './Records'

import * as Html from './vdom/Html'
import * as VirtualDom from './vdom/VirtualDom'

import * as Layout from './layout/Layout'

import * as Color from './style/Color'
import * as  Component from './style/Component'

import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Cmd from './utils/Cmd'

import * as Decoder from './utils/Decoder'

import * as Utils from './utils/Utils'
import * as Maybe from './utils/Maybe'

import * as DateGroup from './DateGroup'

import './index.css'

// STATE ---

/** The whole state of the application.
*/
export type State = {
    records: Records.Records,
    today: Date.Date,
    dateGroupState: DateGroup.State,
}

export function stateOf(state: State): State {
    return state
}

export function initialState(
    storedState: string | null,
    today: Date.Date,
    now: Time.Time
): Update.Update<State, Event> {
    return Update.of(
        newInitialState(today),
        waitTilTomorrow(now)
    )
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
        records: Records.mockRecords(today),
        today,
        dateGroupState: DateGroup.init(),
    }
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
     | { event: "dateGroupEvent", dateGroupEvent: DateGroup.Event }

function eventOf(event: Event): Event {
    return event;
}

function dateGroupEvent(dateGroupEvent: DateGroup.Event): Event {
    return { event: "dateGroupEvent", dateGroupEvent }
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
        
        case "dateGroupEvent":
            return Update.mapBoth(
                DateGroup.update(state.dateGroupState, event.dateGroupEvent),
                dateGroupState => stateOf({ ...state, dateGroupState }),
                dateGroupEvent
            )
    }
}

// --- VIEW

export function view(state: State): Html.Html<Event> {
    return Layout.toHtml(
        { today: state.today },
        "div",
        [
            Html.style("display", "flex"),
            Html.style("flex-direction", "column"),
            Html.style("align-items", "center"),
        ],
        [
            Layout.node(
                "style",
                [],
                [ Layout.text(`
body {
    background-color: ${Color.toCssString(Color.background)};
    border-top: 6px solid ${Color.toCssString(Color.accent)};
    color: ${Color.toCssString(Color.text)};
}
`)
                ],
            ),
            Layout.columnWithSpacing(
                50,
                "div",
                [
                    Html.class_("w-full"),
                    Html.style("max-width", (1024 + 40) + "px"),
                    Html.paddingXY(0, 20),
                ],
                [
                    Layout.space(0),
                    Layout.map(
                        Records.view(
                            state.records.array,
                            state.dateGroupState,
                        ),
                        dateGroupEvent
                    ),
                    Layout.space(0),
                ]
            )
        ]
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
        const updateResult = update(currentState, event)

        const updatedView = view(updateResult.state)
        const patch = VirtualDom.diff(currentView, updatedView, dispatch)

        try {
            patch($rootElement)
            currentState = updateResult.state
            currentView = updatedView
            // El comando se ejecuta sincrónicamente, pero las llamadas a "dispatch"
            // dentro del comando se ejecutan en el siguiente frame.
            updateResult.cmd.execute(waitAFrameAndDispatch)
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

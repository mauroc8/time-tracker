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

import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Cmd from './utils/Task'

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

export const decoder: Decoder.Decoder<State> =
    Decoder.object3(
        'records', Records.decoder,
        'today', Date.decoder,
        'dateGroupState', DateGroup.decoder,
    )

export function stateOf(state: State): State {
    return state
}

export function initialState(
    storedState: string | null,
    today: Date.Date,
    now: Time.Time
): Update.Update<State, Event> {
    if (storedState !== null) {
        try {
            const decodedStordedState = Decoder.decode(
                JSON.parse(storedState),
                decoder
            )

            if (decodedStordedState.tag === 'ok') {
                return Update.of(
                    { ...decodedStordedState.value, today },
                    [ waitTilTomorrow(now) ]
                )
            } else {
                console.log(decodedStordedState)
            }
        } catch (e) {}
    }

    return Update.of(
        newInitialState(today),
        [ waitTilTomorrow(now) ]
    )
}

/** Espera hasta la medianoche para actualizar el `today` */
function waitTilTomorrow(now: Time.Time): Cmd.Task<Event> {
    return Cmd.map(
        Cmd.waitMilliseconds(Time.minutesBeforeMidnight(now) * 60 * 1000),
        (date) => eventOf({ event: 'gotNewDate', date })
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

 /** Event is what's typically called an 'action' in Redux
 */
 export type Event =
     | { event: 'none' }
     | { event: 'gotNewDate', date: globalThis.Date }
     | { event: 'dateGroupEvent', dateGroupEvent: DateGroup.Event }

function eventOf(event: Event): Event {
    return event
}

function dateGroupEvent(dateGroupEvent: DateGroup.Event): Event {
    return { event: 'dateGroupEvent', dateGroupEvent }
}

function update(state: State, event: Event): Update.Update<State, Event> {
    switch (event.event) {
        case 'none':
            return Update.pure(state)

        case 'gotNewDate':
            return Update.of(
                stateOf({ ...state, today: Date.fromJavascriptDate(event.date) }),
                [ waitTilTomorrow(Time.fromJavascriptDate(event.date)) ]
            )
        
        case 'dateGroupEvent':
            return Update.andThen(
                Update.mapBoth(
                    DateGroup.update(state.dateGroupState, event.dateGroupEvent),
                    dateGroupState => stateOf({ ...state, dateGroupState }),
                    dateGroupEvent
                ),
                saveStateToLocalStorage
            )
    }
}

function saveStateToLocalStorage(state: State): Update.Update<State, Event> {
    return Update.of(state, [ Cmd.saveToLocalStorage('state', state) ])
}

// --- VIEW

export function view(state: State): Html.Html<Event> {
    return Layout.toHtml(
        { today: state.today },
        Layout.column(
            'div',
            [
                Layout.centerX(),
            ],
            [
                Html.node(
                    'style',
                    [],
                    [ Html.text(`
body {
    background-color: ${Color.toCssString(Color.background)};
    border-top: 6px solid ${Color.toCssString(Color.accent)};
    color: ${Color.toCssString(Color.text)};
}
    `)
                    ],
                ),
                Layout.column(
                    'div',
                    [
                        Layout.spacing(50),
                        Layout.paddingXY(0, 20),
                        Layout.fullWidth(),
                        Html.style('max-width', (1024 + 40) + 'px'),
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
    )
}

// --- MAIN


let $rootElement = document.getElementById('root') as Element | Text

/** Flags refer to some external state that is passed to app initialization */
const storedState = localStorage.getItem('state')

if ($rootElement !== null) {
    const init = initialState(
        storedState,
        Date.fromJavascriptDate(new window.Date()),
        Time.fromJavascriptDate(new window.Date())
    )

    let currentState = init.state

    requestAnimationFrame(() => {
        for (const cmd of init.cmds) {
            cmd.execute(deferedDispatch)
        }
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
            
            for (const cmd of updateResult.cmds) {
                cmd.execute(deferedDispatch)
            }
        } catch (e) {
            console.error(e)
        }
    }

    /** All commands are executed sinchronously, but their events are dispatched in the next frame.
    */
    function deferedDispatch(event: Event) {
        requestAnimationFrame(() => dispatch(event))
    }

    const $initialRender = Html.toElement(currentView, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender
}

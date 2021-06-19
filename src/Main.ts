
import * as Update from './Update'
import * as Record from './Record'
import * as Records from './Records'

import * as Html from './vdom/Html'

import * as Layout from './layout/Layout'

import * as Color from './style/Color'

import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Cmd from './utils/Task'

import * as Decoder from './utils/Decoder'

import * as Utils from './utils/Utils'
import * as Maybe from './utils/Maybe'

import * as DateGroup from './DateGroup'

import * as Event from './Event'


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

export function init(
    localStorage: string | null,
    today: Date.Date,
    now: Time.Time
): Update.Update<State, Event.Event> {
    if (localStorage !== null) {
        try {
            const decodedStordedState = Decoder.decode(
                JSON.parse(localStorage),
                decoder
            )

            if (decodedStordedState.tag === 'ok') {
                return Update.of(
                    { ...decodedStordedState.value, today },
                    [ waitUntilTomorrow(now) ]
                )
            } else {
                console.info('localStorage decode error', decodedStordedState.error)
            }
        } catch (e) {
            console.info('localStorage parse exception', e)
        }
    }

    return Update.of(
        newInitialState(today),
        [ waitUntilTomorrow(now) ]
    )
}

/** Re-fetch the current date in order to update the `today` in our state. */
function waitUntilTomorrow(now: Time.Time): Cmd.Task<Event.Event> {
    return Cmd.map(
        Cmd.waitMilliseconds(Time.minutesBeforeMidnight(now) * 60 * 1000),
        Event.gotNewDate
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

export function update(state: State, event: Event.Event): Update.Update<State, Event.Event> {
    switch (event.eventName) {
        case 'none':
            return Update.pure(state)

        case 'gotNewDate':
            return Update.of(
                { ...state, today: Date.fromJavascriptDate(event.date) },
                [ waitUntilTomorrow(Time.fromJavascriptDate(event.date)) ]
            )
        
        case 'dateGroupEvent':
            return Update.andThen(
                Update.mapBoth(
                    DateGroup.update(state.dateGroupState, event.event),
                    dateGroupState => ({ ...state, dateGroupState }),
                    Event.dateGroupEvent
                ),
                saveStateToLocalStorage
            )
    }
}

function saveStateToLocalStorage(state: State): Update.Update<State, Event.Event> {
    return Update.of(state, [ Cmd.saveToLocalStorage('state', state) ])
}

// --- VIEW

export function view(state: State): Html.Html<Event.Event> {
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
                        Html.style('max-width', `${1024 + 40}px`),
                    ],
                    [
                        Layout.space(0),
                        Layout.map(
                            Records.view(
                                state.records.array,
                                state.dateGroupState,
                            ),
                            Event.dateGroupEvent
                        ),
                        Layout.space(0),
                    ]
                )
            ]
        )
    )
}

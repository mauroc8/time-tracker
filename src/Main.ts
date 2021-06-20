
import * as Update from './Update'
import * as Record from './Record'
import * as Records from './Records'

import * as Html from './vdom/Html'

import * as Layout from './layout/Layout'

import * as Color from './style/Color'

import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Task from './utils/Task'

import * as Decoder from './utils/Decoder'

import * as Utils from './utils/Utils'
import * as Maybe from './utils/Maybe'
import * as Result from './utils/Result'

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
    dateTime: Date.Javascript,
): Update.Update<State, Event.Event> {
    const today = Date.fromJavascript(dateTime)
    const now = Time.fromJavascript(dateTime)

    return Update.addTask(
        Maybe.fromNullable(localStorage)
            .map(localStorage => decodeLocalStorage<Event.Event>(localStorage, today))
            .withDefault(Update.pure(newInitialState(today))),
        getNewDate(now),
    )
}

function decodeLocalStorage<Evt>(
    localStorage: string,
    today: Date.Date,
): Update.Update<State, Evt> {
    return Utils.jsonParse(localStorage)
        .mapError(errorWithMessage('localStorage parse error'))
        .andThen(json =>
            Decoder.decode(json, decoder)
                .mapError(Decoder.errorToString)
                .mapError(errorWithMessage('localStorage decode error'))
        )
        .caseOf(
            state =>
                Update.pure({ ...state, today }),

            ({ message, error }) =>
                Update.of(
                    newInitialState(today),
                    [
                        Task.logInfo(message),
                        Task.logError(error),
                    ]
                )
        )
}

function errorWithMessage(message: string): (error: unknown) => { message: string, error: unknown } {
    return error => ({ message, error })
}

/** Devuelve la cantidad de minutos que faltan para que termine el día. */
function minutesBeforeMidnight(time: Time.Time): number {
    return Time.toMinutes(Time.time(23, 59)) - Time.toMinutes(time) + 1
}

/** Re-fetch the current date in order to update the `today` in our state. */
function getNewDate(now: Time.Time): Task.Task<Event.Event> {
    return Task.map(
        Task.waitMilliseconds(minutesBeforeMidnight(now) * 60 * 1000),
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
    switch (event.name) {
        case 'none':
            return Update.pure(state)

        case 'gotNewDate':
            return Update.of(
                { ...state, today: Date.fromJavascript(event.date) },
                [ getNewDate(Time.fromJavascript(event.date)) ]
            )

        case 'dateGroupEvent':
            return DateGroup.update(state.dateGroupState, event.event)
                    .mapBoth(
                        dateGroupState => ({ ...state, dateGroupState }),
                        Event.dateGroupEvent
                    )
                    .andThen(saveStateToLocalStorage)

        case 'onRecordPlay':
            return Update.pure(state)

        case 'onRecordDelete':
            return Update.pure({
                ...state,
                records: Records.delete_(state.records, event.id)
            })
        
        case 'onRecordInput':
            return Update.pure({
                ...state,
                records: Records.updateInput(state.records, event.id, event.input, event.value),
            })
        
        case 'onRecordChange':
            return Update.pure({
                ...state,
                records: Records.changeInput(state.records, event.id, event.input, event.value),
            })
    }
}

function saveStateToLocalStorage(state: State): Update.Update<State, Event.Event> {
    return Update.of(state, [ Task.saveToLocalStorage('state', state) ])
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

::selection,
::-moz-selection {
    background-color: ${Color.toCssString(Color.accent50)};
    color: ${Color.toCssString(Color.rgba(1, 1, 1, 0.85))};
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
                        Records.view(
                            state.records.array,
                            state.dateGroupState,
                            {
                                onGroupEvent: Event.dateGroupEvent,
                                onChange: Event.onRecordChange,
                                onInput: Event.onRecordInput,
                                onPlay: Event.onRecordPlay,
                                onDelete: Event.onRecordDelete
                            }
                        ),
                        Layout.space(0),
                    ]
                )
            ]
        )
    )
}

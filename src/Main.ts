
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
import * as Create from './Create'


// STATE ---

/** The whole state of the application.
 */
export type State = {
    records: Records.Records,
    today: Date.Date,
    now: Time.Time,
    dateGroupState: DateGroup.State,
    create: Maybe.Maybe<Create.Create>,
}

export const decoder: Decoder.Decoder<State> =
    Decoder.object5(
        'records', Records.decoder,
        'today', Date.decoder,
        'now', Time.decoder,
        'dateGroupState', DateGroup.decoder,
        'create', Decoder.maybe(Create.decoder),
    )

export function init(
    localStorage: string | null,
    dateTime: Date.Javascript,
): Update.Update<State, Event.Event> {
    return Update.addTask(
        Maybe.fromNullable(localStorage)
            .map(localStorage => decodeLocalStorage<Event.Event>(localStorage, dateTime))
            .withDefault(Update.pure(newInitialState(dateTime))),
        getNewTime(dateTime),
    )
}

function decodeLocalStorage<Evt>(
    localStorage: string,
    dateTime: Date.Javascript,
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
                Update.pure({ ...state, today: Date.fromJavascript(dateTime) }),

            ({ message, error }) =>
                Update.of(
                    newInitialState(dateTime),
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

function getNewTime(now: Date.Javascript): Task.Task<Event.Event> {
    return Task
        .waitMilliseconds(1000 - now.getMilliseconds() % 1000)
        .map(Event.gotNewTime)
}

function newInitialState(dateTime: Date.Javascript): State {
    const today = Date.fromJavascript(dateTime)

    return {
        records: Records.mockRecords(today),
        today,
        now: Time.fromJavascript(dateTime),
        dateGroupState: DateGroup.init(),
        create: Maybe.nothing(),
    }
}

// --- UPDATE

export function update(state: State, event: Event.Event): Update.Update<State, Event.Event> {
    switch (event.name) {
        case 'none':
            return Update.pure(state)

        case 'gotNewTime': {
            const today = Date.fromJavascript(event.date)
            const now = Time.fromJavascript(event.date)

            return Update.of(
                {
                    ...state,
                    create: state.create.map(create => Create.updateDuration(create, state.now, now)),
                    today,
                    now,
                },
                [ getNewTime(event.date) ]
            )
        }

        case 'dateGroupEvent':
            return DateGroup.update(state.dateGroupState, event.event)
                .mapBoth(
                    dateGroupState => ({ ...state, dateGroupState }),
                    Event.dateGroupEvent
                )
                .andThen(saveStateToLocalStorage)

        case 'onRecordPlay': {
            const record = Records.findById(state.records, event.id)

            return Update.pure(
                createRecordPlay(
                    state,
                    record?.description || '',
                    record?.task || '',
                ),
            )
        }

        case 'onRecordDelete':
            return Update.pure<State, Event.Event>({
                ...state,
                records: Records.delete_(state.records, event.id)
            })
            .andThen(saveStateToLocalStorage)

        case 'onRecordInput':
            return Update.pure<State, Event.Event>({
                ...state,
                records: Records.updateInput(state.records, event.id, event.input, event.value),
            })
            .andThen(saveStateToLocalStorage)

        case 'onRecordChange':
            return Update.pure<State, Event.Event>({
                ...state,
                records: Records.changeInput(state.records, event.id, event.input, event.value),
            })
            .andThen(saveStateToLocalStorage)

        case 'onCreateStart':
            return Update.pure(createRecordPlay(state, '', ''))

        case 'onCreateInput':
            return Update.pure({
                ...state,
                create: state.create.map(create => Create.updateInput(create, event.input, event.value))
            })

        case 'onCreateChange':
            return Update.pure({
                ...state,
                create: state.create
                    .map(create =>
                        Create.changeInput(create, event.input, event.value, state.now)
                    )
            })

        case 'onCreateStop':
            return Update.pure(state)

    }
}

function createRecordPlay(state: State, description: string, task: string): State {
    return {
        ...state,
        create: Maybe.just(
            Create.create({
                description: description,
                task: task,
                now: state.now,
                today: state.today,
            }),
        ),
    }
}

function saveStateToLocalStorage(state: State): Update.Update<State, Event.Event> {
    return Update.of(state, [ Task.saveToLocalStorage('state', state) ])
}

// --- VIEW

const createConfig = {
    onStart: Event.onCreateStart,
    onInput: Event.onCreateInput,
    onChange: Event.onCreateChange,
    onStop: Event.onCreateStop,
}

const recordsConfig = {
    onGroupEvent: Event.dateGroupEvent,
    onChange: Event.onRecordChange,
    onInput: Event.onRecordInput,
    onPlay: Event.onRecordPlay,
    onDelete: Event.onRecordDelete
}

const staticCss = `
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
`

export function view(state: State): Html.Html<Event.Event> {
    return Layout.toHtml(
        { today: state.today, now: state.now },
        Layout.column(
            'div',
            [
                Layout.centerX(),
            ],
            [
                Html.node('style', [], [ Html.text(staticCss) ]),
                Layout.column(
                    'div',
                    [
                        Layout.spacing(50),
                        Layout.paddingXY(12, 20),
                        Layout.fullWidth(),
                        Html.style('max-width', `${1024 + 40}px`),
                    ],
                    [
                        Layout.space(0),
                        Create.view(state.create, createConfig),
                        Records.view(
                            state.records.array,
                            state.dateGroupState,
                            recordsConfig
                        ),
                        Layout.space(0),
                    ]
                )
            ]
        )
    )
}

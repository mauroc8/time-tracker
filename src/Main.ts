
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
import * as Codec from './utils/Codec'

import * as Utils from './utils/Utils'
import * as Maybe from './utils/Maybe'
import * as Result from './utils/Result'
import * as SortedArray from './utils/SortedArray'

import * as DateGroup from './DateGroup'

import * as Event from './Event'
import * as Create from './Create'


// STATE ---

/** The whole state of the application.
 */
export type State = {
    records: Records.Records,
    dateGroupState: DateGroup.State,
    create: Maybe.Interface<Create.Create>,
    today: Date.Date,
    now: Time.Time,
}

export const codec: Codec.Codec<State> =
    Codec.struct({
        records: Records.codec,
        dateGroupState: DateGroup.codec,
        create: Codec.maybe(Create.codec),
        today: Date.codec,
        now: Time.codec,
    })

export function init(
    localStorage: string | null,
    now: Date.Javascript,
): Update.Update<State, Event.Event> {
    return Update.of(
        Maybe.fromNullable(localStorage)
            .andThen(localStorage => getInitialState(localStorage, now))
            .withDefault(newInitialState(now)),
        [Task.waitMilliseconds(Event.gotNewTime, 0)],
    )
}

function getInitialState(
    localStorage: string,
    now: Date.Javascript,
): Maybe.Maybe<State> {
    return Result.toMaybe(
        Utils.jsonParse(localStorage)
            .mapError(error => Utils.debugException('Json parse error', error))
            .andThen(json =>
                Decoder.decode(json, codec.decoder)
                    .mapError(error => Utils.debugException('Json decode error', error))
            )
            .map(state => updateTime(state, now))
    )
}

function getNewTime(now: Date.Javascript): Task.Task<Event.Event> {
    const minute = 60 * 1000

    return Task.waitMilliseconds(Event.gotNewTime, minute - Number(now) % minute)
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

/** Gets called when `today` or `now` needs updating. */
function updateTime(state: State, dateTime: Date.Javascript): State {
    return Maybe.caseOf(
        state.create,
        create => updateCreateTime(state, create, dateTime),
        () => ({ ...state, ...getTodayAndNow(dateTime) }),
    )
}

function getTodayAndNow(dateTime: Date.Javascript): { today: Date.Date, now: Time.Time } {
    return {
        today: Date.fromJavascript(dateTime),
        now: Time.fromJavascript(dateTime)
    }
}

/** Gets called when `today` or `now` changed while creating a record. */
function updateCreateTime(
    state: State,
    create: Create.Create,
    dateTime: Date.Javascript,
): State {
    const { today, now } = getTodayAndNow(dateTime);

    /** If we're in a different day to the one saved in the model,
     * the information in `Create` is transformed to a `Record` because
     * `Record`s cannot span across different days.
     * 
     * We also automatically start a new `Create` for the current time.
    */
    if (!Utils.equals(state.today, today)) {
        return {
            ...saveCreateRecord(state, dateTime),
            create: Maybe.just(Create.changeInput(create, 'start', Time.toString(now), now)),
        }
    }

    return {
        ...state,
        create: state.create.map(create =>
            Create.updateTime(
                create,
                state.now,
                now
            )
        ),
        today,
        now,
    }
}

export function update(state: State, event: Event.Event, timestamp: Date.Javascript): Update.Update<State, Event.Event> {
    switch (event.name) {
        case 'none':
            return Update.pure(state)

        case 'gotNewTime': {
            return Update.of(
                updateTime(state, event.dateTime),
                [getNewTime(event.dateTime)],
            )
        }

        case 'dateGroupEvent':
            return DateGroup.update(state.dateGroupState, event.event)
                .mapBoth(
                    dateGroupState => ({ ...state, dateGroupState }),
                    Event.dateGroupEvent
                )
                .andThen(saveToLocalStorage)

        case 'onRecordPlay': {
            const record = Records.findById(state.records, event.id)

            return Update.pure(
                createRecordPlay(
                    saveCreateRecord(state, timestamp),
                    record?.description || '',
                    record?.task || '',
                ),
            )
                .andThen(saveToLocalStorage)
        }

        case 'onRecordDelete':
            return Update.pure({
                ...state,
                records: Records.delete_(state.records, event.id)
            })
            .andThen(saveToLocalStorage)

        case 'onRecordInput':
            return Update.pure({
                ...state,
                records: Records.updateInput(state.records, event.id, event.input, event.value),
            })
            .andThen(saveToLocalStorage)

        case 'onRecordChange':
            return Update.pure({
                ...state,
                records: Records.changeInput(state.records, event.id, event.input, event.value),
            })
            .andThen(saveToLocalStorage)

        case 'onCreateStart':
            return Update
                .pure(createRecordPlay(state, '', ''))
                .andThen(saveToLocalStorage)

        case 'onCreateInput':
            return Update.pure({
                ...state,
                create: state.create.map(create => Create.updateInput(create, event.input, event.value))
            })
                .andThen(saveToLocalStorage)

        case 'onCreateChange':
            return Update.pure({
                ...state,
                create: state.create
                    .map(create =>
                        Create.changeInput(create, event.input, event.value, state.now)
                    )
            })
                .andThen(saveToLocalStorage)

        case 'onCreateStop':
            return Update.pure(saveCreateRecord(state, timestamp))
                .andThen(saveToLocalStorage)
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
            }),
        ),
    }
}

function saveToLocalStorage(state: State): Update.Update<State, Event.Event> {
    return Update.of(
        state,
        [
            Task.saveToLocalStorage('state', codec.encode(state)),
        ],
    )
}

/** Create a new record from model.create. */
function saveCreateRecord(state: State, datestamp: Date.Javascript): State {
    return state.create.map(create => ({
        ...state,
        create: Maybe.nothing<Create.Create>(),
        records: Records.add(
            Create.toRecord(
                create,
                Record.id(Number(datestamp)),
                state.today,
                state.now
            ),
            state.records
        ),
        ...getTodayAndNow(datestamp),
    }))
        .withDefault(state)
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

const bodyCss = `
background-color: ${Color.toCssString(Color.background)};
border-top: 6px solid ${Color.toCssString(Color.accent)};
color: ${Color.toCssString(Color.text)};
font-family: Lato, -apple-system, BlinkMacSystemFont, "Avenir Next", Avenir,
    "Helvetica Neue", Helvetica, Ubuntu, Roboto, Noto, "Segoe UI", Arial, sans-serif;
box-sizing: border-box;
line-height: 1;
`

const selectionCss = `
background-color: ${Color.toCssString(Color.accent50)};
color: ${Color.toCssString(Color.rgba(1, 1, 1, 0.85))};
`

const resetCss = `
margin: 0;
padding: 0;
font: inherit;
box-sizing: inherit;
text-decoration: inherit;
font-weight: inherit;
font-size: inherit;
background: transparent;
border: 0;
color: inherit;
text-align: inherit;
outline-color: transparent;
`


export function view(state: State): Html.Html<Event.Event> {
    return Layout.toHtml(
        { today: state.today, now: state.now },
        'div',
        [
            Html.style('width', '100%'),
        ],
        Layout.column(
            'div',
            [
                Layout.centerX(),
                Layout.rawCss('*', resetCss),
                Layout.rawCss('body', bodyCss),
                Layout.rawCss('::selection,::-moz-selection', selectionCss),
                Layout.rawCss('*:focus', `outline: 1px solid ${Color.toCssString(Color.accent)}`),
                Layout.rawCss('button,summary', 'cursor: pointer'),
            ],
            [
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
                            state.records.toArray,
                            state.dateGroupState,
                            recordsConfig
                        ),
                        Layout.space(0),
                    ]
                ),
            ]
        )
    )
}

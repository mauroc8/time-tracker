
import * as Record from './Record'
import * as Update from './Update'

import * as Maybe from './utils/Maybe'
import * as Result from './utils/Result'
import * as Date from './utils/Date'
import * as Time from './utils/Time'

import * as Html from './vdom/Html'

import * as Decoder from './utils/Decoder'

import * as Layout from './layout/Layout'

import * as Component from './style/Component'

/** State of the 'create record' form.
 */
export type CreateRecord = {
    descriptionInput: string,
    taskInput: string,
    start: Maybe.Maybe<Start>,
}

export type Start = {
    input: string,
    time: Time.Time,
    date: Date.Date,
}

export function start(time: Time.Time, date: Date.Date): Start {
    return { input: Time.toString(time), time, date }
}

export function empty(descriptionInputValue: string): CreateRecord {
    return {
        descriptionInput: descriptionInputValue,
        taskInput: '',
        start: Maybe.nothing(),
    }
}

export function withStart(time: Time.Time, date: Date.Date, createRecord: CreateRecord): CreateRecord {
    return {
        ...createRecord,
        start: Maybe.just(start(time, date)),
    }
}

export function withTask(taskInputValue: string, createRecord: CreateRecord): CreateRecord {
    return { ...createRecord, taskInput: taskInputValue }
}

export function withStartInput(startInputValue: string, createRecord: CreateRecord): CreateRecord {
    return Time.fromString(startInputValue)
        .map(newStartTime =>
            ({
                ...createRecord,
                start: createRecord.start.map(s => start(newStartTime, s.date))
            })
        )
        .withDefault(createRecord)
}

export function sanitizeInputs(createRecord: CreateRecord): CreateRecord {
    return {
        ...createRecord,
        start: createRecord.start.map(s => start(s.time, s.date))
    }
}

export type Error =
    | { tag: "emptyDescription" }
    | { tag: "emptyTask" }
    | { tag: "emptyBoth" }

const emptyDescription: Error = { tag: 'emptyDescription' }
const emptyTask: Error = { tag: 'emptyTask' }
const emptyBoth: Error = { tag: 'emptyBoth' }

function hasEmptyDescription(createRecord: CreateRecord): boolean {
    return createRecord.descriptionInput.trim() === ''
}

function hasEmptyTask(createRecord: CreateRecord): boolean {
    return createRecord.taskInput.trim() === ''
}

function getError(createRecord: CreateRecord): Maybe.Maybe<Error> {
    if (
        hasEmptyDescription(createRecord)
            && hasEmptyTask(createRecord)
    ) {
        return Maybe.just(emptyBoth)
    }

    if (
        hasEmptyDescription(createRecord)
    ) {
        return Maybe.just(emptyDescription)
    }

    if (
        hasEmptyTask(createRecord)
    ) {
        return Maybe.just(emptyTask)
    }

    return Maybe.nothing()
}

export function toRecord(
    recordId: Record.Id,
    endTime: Time.Time,
    endDate: Date.Date,
    createRecord: CreateRecord,
): Result.Result<Record.Record, Error> {
    return getError(createRecord)
        .map(x => Result.error<Record.Record, Error>(x))
        .withDefault(
            Result.ok<Record.Record, Error>(
                Record.record(
                    recordId,
                    createRecord.descriptionInput,
                    createRecord.taskInput,
                    createRecord.start.map(({ time }) => time).withDefault(endTime),
                    endTime,
                    createRecord.start.map(({ date }) => date).withDefault(endDate)
                )
            )
        )
}

export function view<A>(
    attributes: Array<Html.Attribute<A>>,
    args: {
        createRecord: CreateRecord,
        records: Array<Record.Record>,
    }
): Layout.Layout<A> {

    const redBorder: Html.Attribute<A> =
        Html.style("borderColor", "red")

    return Layout.row<A>(
        "div",
        attributes,
        [
            Component.textInput(
                [],
                {
                    id: "createRecord-description",
                    label: Layout.text("Descripción"),
                    value: args.createRecord.descriptionInput,
                    attributes: [
                        (() => {
                            if (hasEmptyDescription(args.createRecord)) {
                                return redBorder
                            } else {
                                return Html.class_<A>("")
                            }
                        })(),
                    ],
                }
            ),
            Component.textInput(
                [],
                {
                    id: "createRecord-task",
                    label: Layout.text("Tarea"),
                    value: args.createRecord.taskInput,
                    attributes: [
                        (() => {
                            if (hasEmptyTask(args.createRecord)) {
                                return redBorder
                            } else {
                                return Html.class_<A>("")
                            }
                        })()
                    ],
                }
            ),
            ...args.createRecord.start.map<Array<Layout.Layout<A>>>(({ input }) => [
                Component.textInput(
                    [],
                    {
                        id: "create-record-start-time",
                        label: Layout.text("Start time"),
                        value: input,
                        attributes: [],
                    }
                ),
                Layout.fromHtml(
                    Html.node(
                        "button",
                        [
                            //Html.on("click", (event: any) => Update.clickedButton(Button.stop()))
                        ],
                        [
                            Html.text("Parar"),
                        ]
                    ),
                    {}
                )
            ])
                .withDefault([
                    Layout.fromHtml(
                        Html.node(
                            "button",
                            [
                                //Html.on("click", (_) => Update.clickedButton(Button.play()))
                            ],
                            [
                                Html.text("Empezar")
                            ]
                        ),
                        {}
                    )
                ])
        ]
    )
}

export const decoder: Decoder.Decoder<CreateRecord> =
    Decoder.map3(
        Decoder.property('descriptionInput', Decoder.string),
        Decoder.property('taskInput', Decoder.string),
        Decoder.property(
            'start',
            Decoder.maybe(
                Decoder.map2(
                    Decoder.property('time', Time.decoder),
                    Decoder.property('date', Date.decoder),
                    start
                )
            )
        ),
        (descriptionInput, taskInput, start) =>
            ({
                descriptionInput,
                taskInput,
                start
            })
    )

export function resumeRecord(now: Time.Time, today: Date.Date, record: Record.Record): CreateRecord {
    return {
        descriptionInput: record.description,
        taskInput: record.taskInput,
        start: Maybe.just(start(now, today))
    }
}

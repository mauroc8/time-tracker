
import * as Maybe from './utils/Maybe'
import * as Utils from './utils/Utils'
import * as Update from './Update'
import * as Levenshtein from './utils/Levenshtein'
import * as Layout from './layout/Layout'
import * as Input from './layout/Input'
import * as Html from './vdom/Html'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Decoder from './utils/Decoder'
import * as Time from './utils/Time'
import * as Date from './utils/Date'

import './Record.css'

export type Id = {
    tag: 'recordId',
    id: number,
}

const idDecoder: Decoder.Decoder<Id> =
    Decoder.object2(
        'tag', Decoder.literal('recordId'),
        'id', Decoder.number,
    )

export function id(id: number): Id {
    return { tag: 'recordId', id }
}

// RECORD ---

export type Record = {
    id: Id,
    description: string,
    task: string,
    startInput: string,
    startTime: Time.Time,
    endInput: string,
    endTime: Time.Time,
    durationInput: string,
    date: Date.Date,
}

export const decoder: Decoder.Decoder<Record> =
    Decoder.object9(
        'id', idDecoder,
        'description', Decoder.string,
        'task', Decoder.string,
        'startInput', Decoder.string,
        'startTime', Time.decoder,
        'endInput', Decoder.string,
        'endTime', Time.decoder,
        'durationInput',  Decoder.string,
        'date', Date.decoder
    )

export function record(
    id: Id,
    description: string,
    task: string,
    start: Time.Time,
    end: Time.Time,
    date: Date.Date
): Record {
    return {
        id,
        description,
        startInput: Time.toString(start),
        startTime: start,
        endInput: Time.toString(end),
        endTime: end,
        durationInput: Time.toString(Time.difference(start, end)),
        task: task,
        date,
    }
}

export function getDuration(record: Record): Time.Time {
    return Time.difference(record.startTime, record.endTime)
}

export function setStartInput(startInput: string, record: Record): Record {
    return {
        ...record,
        startInput,
        startTime: Time.fromString(startInput).withDefault(record.startTime)
    }
}

export function setEndInput(endInput: string, record: Record): Record {
    return {
        ...record,
        endInput,
        endTime: Time.fromString(endInput).withDefault(record.endTime)
    }
}

export function setStartTime(startTime: Time.Time, record: Record): Record {
    return {
        ...record,
        startTime,
        startInput: Time.toString(startTime),
    }
}

export function setEndTime(endTime: Time.Time, record: Record): Record {
    return {
        ...record,
        endTime,
        endInput: Time.toString(endTime),
    }
}

export function setDurationInput(durationInput: string, record: Record): Record {
    return Maybe.caseOf(
        Time.fromString(durationInput),
        durationTime => setDurationTime(durationTime, record),
        () =>
            ({
                ...record,
                durationInput,
            })
    )
}

export function setDurationTime(durationTime: Time.Time, record: Record): Record {
    return setEndTime(
        Time.add(record.startTime, durationTime),
        {
            ...record,
            durationInput: Time.toString(durationTime),
        }
    )
}

export function compare(a: Record, b: Record): -1 | 0 | 1 {
    const dateComparison = Date.compare(a.date, b.date)

    if (dateComparison == 0) {
        return Time.compare(a.startTime, b.startTime)
    }

    return dateComparison
}

/** Cleans user input data that isn't in sync with its typed version.
*/
export function cleanInputs(record: Record): Record {
    return setDurationTime(
        getDuration(record),
        setStartTime(
            record.startTime,
            record
        )
    )
}

export function view<E, C>(
    record: Record,
    options: {
        onChange: (input: InputName, value: string) => E,
        onInput: (input: InputName, value: string) => E,
        onPlay: E,
        onDelete: E,
    },
): Layout.Layout<E, C> {
    return Layout.row(
        'div',
        [
            Layout.spacing(17),
        ],
        [
            Input.text(
                'column',
                [
                    Layout.grow(4),
                ],
                {
                    id: `record_${record.id.id}_description`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Descripción')]
                    ),
                    value: record.description,
                    attributes: [
                        Input.onInput(value => options.onInput('description', value)),
                        Input.onChange(value => options.onChange('description', value)),
                    ],
                }
            ),
            Input.text(
                'column',
                [
                    Layout.grow(2),
                ],
                {
                    id: `record_${record.id.id}_task`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Tarea')]
                    ),
                    value: record.task,
                    attributes: [
                        Input.onInput(value => options.onInput('task', value)),
                        Input.onChange(value => options.onChange('task', value)),
                    ],
                }
            ),
            Input.text(
                'column',
                [
                    Layout.shrink(1),
                    Html.style('text-align', 'right'),
                ],
                {
                    id: `record_${record.id.id}_start`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Inicio')]
                    ),
                    value: record.startInput,
                    attributes: [
                        Input.onInput(value => options.onInput('start', value)),
                        Input.onChange(value => options.onChange('start', value)),
                    ],
                }
            ),
            Input.text(
                'column',
                [
                    Layout.shrink(1),
                    Html.style('text-align', 'right'),
                ],
                {
                    id: `record_${record.id.id}_end`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Fin')]
                    ),
                    value: record.endInput,
                    attributes: [
                        Input.onInput(value => options.onInput('end', value)),
                        Input.onChange(value => options.onChange('end', value)),
                    ],
                }
            ),
            Input.text(
                'column',
                [
                    Layout.shrink(1),
                    Html.style('text-align', 'right'),
                ],
                {
                    id: `record_${record.id.id}_duration`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Duración')]
                    ),
                    value: Time.toString(Time.difference(record.endTime, record.startTime)),
                    attributes: [
                        Input.onInput(value => options.onInput('duration', value)),
                        Input.onChange(value => options.onChange('duration', value)),
                    ],
                }
            ),
            Layout.column(
                'div',
                [
                    Layout.spacing(8),
                    Html.style('width', '16px'),
                    Layout.startY(),
                ],
                [
                    Icon.button(
                        [
                            Html.class_('record-play'),
                        ],
                        Icon.play(),
                        {
                            onClick: _ => options.onPlay,
                            ariaLabel: 'Resumir tarea'
                        }
                    ),
                    Layout.below(
                        'column',
                        'details',
                        [
                            Html.class_('record-menu'),
                        ],
                        [
                            Icon.wrapper(
                                'summary',
                                [],
                                Icon.options()
                            )
                        ],
                        {
                            flexDirection: 'column',
                            tagName: 'div',
                            attributes: [
                                Html.style('right', '0'),
                                Html.style('margin-top', '8px'),
                                Layout.backgroundColor(Color.background),
                                Layout.padding(12),
                                Html.style('font-size', '12px'),
                                Html.style('box-shadow', '-1px 2px 3px rgba(0, 0, 0, 0.45)')
                            ],
                            children: [
                                Input.button(
                                    [],
                                    {
                                        onClick: _ => options.onDelete,
                                        label: Html.text('Eliminar'),
                                    }
                                )
                            ]
                        }
                    )
                ]
            )
        ]
    )
}

export function searchDescription(query: string, records: Array<Record>): Array<Record> {
    if (query === '')
        return []
    else
        return records.map<[Record, number]>(record =>
            [record, Levenshtein.distance(query.toLowerCase(), record.description.toLowerCase())]
        )
            .sort((a: [Record, number], b: [Record, number]) => {
                const [recordA, distanceA] = a
                const [recordB, distanceB] = b

                return distanceA - distanceB
            })
            .map(([record, _]) => record)
}

export type InputName =
    | 'description'
    | 'task'
    | 'start'
    | 'end'
    | 'duration'

/** Updates the input's string value but not the Time */
export function updateInput(record: Record, input: InputName, value: string): Record {
    switch (input) {
        case 'description':
            return { ...record, description: value }
        case 'task':
            return { ...record, task: value }
        case 'start':
            return { ...record, startInput: value }
        case 'end':
            return { ...record, endInput: value }
        case 'duration':
            return { ...record, durationInput: value }
    }
}

/** Updates the input's string value and tries to update the Time */
export function changeInput(record: Record, input: InputName, value: string): Record {
    switch (input) {
        case 'description':
            return { ...record, description: value }
        case 'task':
            return { ...record, task: value }
        case 'start':
            return setStartInput(value, record)
        case 'end':
            return setEndInput(value, record)
        case 'duration':
            return setDurationInput(value, record)
    }
}


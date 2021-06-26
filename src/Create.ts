import * as Layout from './layout/Layout'
import * as Input from './layout/Input'
import * as Icon from './style/Icon'
import * as Color from './style/Color'
import * as Date from './utils/Date'
import * as Maybe from './utils/Maybe'
import * as Decoder from './utils/Decoder'
import * as Time from './utils/Time'
import * as Utils from './utils/Utils'
import * as Html from './vdom/Html'
import * as Codec from './utils/Codec'
import * as Result from './utils/Result'
import * as Record from './Record'

export type Create = {
    description: string,
    task: string,
    startInput: string,
    startTime: Time.Time,
    durationInput: string,
}

export const codec: Codec.Codec<Create> =
    Codec.map(
        Codec.struct({
            description: Codec.string,
            task: Codec.string,
            startTime: Time.codec,
            durationInput: Codec.string,
        }),
        /** Don't save the `start input` prevent some invalid states.
        */
        (create) => ({ ...create, startInput: Time.toString(create.startTime) }),
        Utils.id
    )

export function create(
    options: {
        description: string,
        task: string,
        now: Time.Time,
    }
): Create {
    return {
        description: options.description,
        task: options.task,
        startInput: Time.toString(options.now),
        startTime: options.now,
        durationInput: durationString(options.now, options.now),
    }
}

function durationString(end: Time.Time, start: Time.Time): string {
    return Time.toString(Time.difference(end, start))
}

export function toRecord(create: Create, id: Record.Id, today: Date.Date, now: Time.Time): Record.Record {
    return Record.record(
        id,
        create.description,
        create.task,
        create.startTime,
        now,
        today
    )
}

export function updateDuration(
    create: Create,
    oldTime: Time.Time,
    now: Time.Time,
): Create {
    // (!) This should be true iff the user's editing the duration input
    if (create.durationInput !== durationString(oldTime, create.startTime)) {
        // I avoid changing the value of an input that's being edited by the user!
        return create
    }

    return {
        ...create,
        durationInput: durationString(now, create.startTime)
    }
}

function normalize(create: Create, now: Time.Time): Create {
    return {
        ...create,
        startInput: Time.toString(create.startTime),
        durationInput: durationString(now, create.startTime),
    }
}

function setStartInput(create: Create, value: string, now: Time.Time): Create {
    const startTime = Time
        .fromString(value)
        .withDefault(create.startTime)

    return normalize(
        {
            ...create,
            startTime,
        },
        now
    )
}

function setDurationInput(create: Create, value: string, now: Time.Time): Create {
    const duration = Time
        .fromString(value)

    const startTime = duration
        .map(duration => Time.difference(now, duration))
        .withDefault(create.startTime)

    return normalize(
        {
            ...create,
            startTime
        },
        now
    )
}

export type InputName =
    | 'description'
    | 'task'
    | 'start'
    | 'duration'

export function updateInput(create: Create, input: InputName, value: string): Create {
    switch (input) {
        case 'description':
            return { ...create, description: value }

        case 'task':
            return { ...create, task: value }

        case 'start':
            return { ...create, startInput: value }

        case 'duration':
            return { ...create, durationInput: value }
    }
}

export function changeInput(create: Create, input: InputName, value: string, now: Time.Time): Create {
    switch (input) {
        case 'description':
        case 'task':
            return updateInput(create, input, value)
        
        case 'start':
            return setStartInput(create, value, now)

        case 'duration':
            return setDurationInput(create, value, now)
    }
}

export function view<E, C extends { today: Date.Date, now: Time.Time }>(
    create: Maybe.Maybe<Create>,
    config: {
        onStart: E,
        onInput: (input: InputName, value: string) => E,
        onChange: (input: InputName, value: string) => E,
        onStop: E,
    },
): Layout.Layout<E, C> {
    return Maybe.caseOf(
        create,
        c => viewCreate(c, config),
        () => viewButton(config),
    )
}

function viewCreate<E, C extends { today: Date.Date, now: Time.Time }>(
    create: Create,
    options: {
        onInput: (input: InputName, value: string) => E,
        onChange: (input: InputName, value: string) => E,
        onStop: E,
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
                    Layout.spacing(14),
                    Layout.grow(4),
                ],
                {
                    id: `create_description`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Descripción')],
                    ),
                    value: create.description,
                    attributes: [
                        Input.onInput(value => options.onInput('description', value)),
                        Input.onChange(value => options.onChange('description', value)),
                    ],
                },
            ),
            Input.text(
                'column',
                [
                    Layout.spacing(14),
                    Layout.grow(1),
                ],
                {
                    id: `create_task`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Tarea')],
                    ),
                    value: create.task,
                    attributes: [
                        Input.onInput(value => options.onInput('task', value)),
                        Input.onChange(value => options.onChange('task', value)),
                    ],
                },
            ),
            Input.text(
                'column',
                [
                    Layout.spacing(14),
                    Layout.widthPx(95),
                    Html.style('text-align', 'right'),
                ],
                {
                    id: `create_start`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Inicio')],
                    ),
                    value: create.startInput,
                    attributes: [
                        Input.onInput(value => options.onInput('start', value)),
                        Input.onChange(value => options.onChange('start', value)),
                    ],
                },
            ),
            Layout.usingContext(({ now }) =>
                Input.text(
                    'column',
                    [
                        Layout.spacing(14),
                        Layout.widthPx(95),
                        Html.style('text-align', 'right'),
                        Html.style('opacity', '50%'),
                    ],
                    {
                        id: `create_end`,
                        label: Layout.column(
                            'div',
                            [Layout.paddingXY(8, 0)],
                            [Layout.text('Fin')],
                        ),
                        value: Time.toString(now),
                        attributes: [
                            Input.onInput(value => options.onInput('duration', value)),
                            Input.onChange(value => options.onChange('duration', value)),
                            Html.property('disabled', true),
                        ],
                    },
                ),
            ),
            Input.text(
                'column',
                [
                    Layout.spacing(14),
                    Layout.widthPx(95),
                    Html.style('text-align', 'right'),
                ],
                {
                    id: `create_duration`,
                    label: Layout.column(
                        'div',
                        [Layout.paddingXY(8, 0)],
                        [Layout.text('Duración')],
                    ),
                    value: create.durationInput,
                    attributes: [
                        Input.onInput(value => options.onInput('duration', value)),
                        Input.onChange(value => options.onChange('duration', value)),
                    ],
                },
            ),
            Layout.column(
                'div',
                [
                    Layout.spacing(8),
                    Layout.widthPx(16),
                    Layout.startY(),
                ],
                [
                    Icon.button(
                        [
                            Html.class_('record-play'),
                        ],
                        Icon.play(),
                        {
                            onClick: options.onStop,
                            ariaLabel: 'Parar',
                        },
                    ),
                ],
            ),
        ]
    )
}

function viewButton<E, C extends { today: Date.Date }>(
    config: {
        onStart: E,
    },
): Layout.Layout<E, C> {
    return Layout.row(
        'div',
        [
            Layout.spacing(17),
        ],
        [
            Input.button(
                'row',
                [

                ],
                [Html.text('Empezar tarea')],
                {
                    onClick: config.onStart
                }
            ),
        ],
    )
}

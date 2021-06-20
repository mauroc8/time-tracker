import * as Layout from './layout/Layout'
import * as Date from './utils/Date'
import * as Decoder from './utils/Decoder'
import * as Time from './utils/Time'

export type Create = {
    description: string,
    task: string,
    startInput: string,
    startTime: Time.Time,
    durationInput: string,
    date: Date.Date,
}

export const decoder: Decoder.Decoder<Create> =
    Decoder.object6(
        'description', Decoder.string,
        'task', Decoder.string,
        'startInput', Decoder.string,
        'startTime', Time.decoder,
        'durationInput', Decoder.string,
        'date', Date.decoder,
    )

export function create(
    options: {
        description: string,
        task: string,
        now: Time.Time,
        today: Date.Date,
    }
): Create {
    return {
        description: options.description,
        task: options.task,
        startInput: Time.toString(options.now),
        startTime: options.now,
        durationInput: Time.toString(Time.time(0, 0)),
        date: options.today,
    }
}

export function view<E, C extends { today: Date.Date }>(
    create: Create,
    options: {

    },
): Layout.Layout<E, C> {
    return Layout.none()
}

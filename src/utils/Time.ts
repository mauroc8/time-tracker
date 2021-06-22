import * as Maybe from './Maybe'
import * as Decoder from './Decoder'
import * as Date from './Date'

export type Time =
    { hours: number, minutes: number }

export function time(hours: number, minutes: number): Time {
    return {
        hours: Math.min(Math.max(0, Math.floor(hours)), 23),
        minutes: Math.min(Math.max(0, Math.floor(minutes)), 59)
    }
}

export function fromJavascript(date: Date.Javascript): Time {
    return time(date.getHours(), date.getMinutes())
}

export const decoder: Decoder.Decoder<Time> =
    Decoder.map2(
        Decoder.property('hours', Decoder.number),
        Decoder.property('minutes', Decoder.number),
        time
    )

export function fromString(input: string): Maybe.Maybe<Time> {
    const matches = input.match(/(\d\d?)[:\- ]*(\d\d?)?/)

    var hours: Maybe.Maybe<number> = Maybe.nothing()
    var minutes: Maybe.Maybe<number> = Maybe.nothing()

    if (matches !== null) {
        if (matches[1] !== undefined) {
            var hours_ = Number(matches[1])

            if (!Number.isNaN(hours_) && hours_ < 24) {
                hours = Maybe.just(hours_)
                minutes = Maybe.just(0)
            }
        }

        if (matches[2] !== undefined) {
            var minutes_ = Number(matches[2])

            if (!Number.isNaN(minutes_) && minutes_ < 60) {
                minutes = Maybe.just(minutes_)
            }
        }
    }

    return Maybe.map2(time, hours, minutes)
}

export function compare(a: Time, b: Time): -1 | 0 | 1 {
    return a.hours < b.hours || (a.hours == b.hours && a.minutes < b.minutes)
        ? -1
        : a.hours == b.hours && a.minutes == b.minutes
        ? 0
        : 1
}

function pad(n: number): string {
    return n < 10
        ? `0${n}`
        : `${n}`
}

export function toString(time: Time): string {
    return `${pad(time.hours)}:${pad(time.minutes)}`
}

/** Minutos negativos se convierten en el tiempo 00:00 */
export function fromMinutes(minutes: number): Time {
    return time(minutes / 60, minutes % 60)
}

export function toMinutes(time: Time): number {
    return time.hours * 60 + time.minutes
}

export function difference(end: Time, start: Time): Time {
    return fromMinutes(Math.max(0, toMinutes(end) - toMinutes(start)))
}

export function add(a: Time, b: Time): Time {
    return fromMinutes(toMinutes(a) + toMinutes(b))
}

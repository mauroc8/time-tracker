import * as Maybe from './Maybe'


function pad(number: number): string {
    return number < 10 ? `0${number}` : String(number)
}

export function dateToString(date: Date): string {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function dateFromString(date: Date, input: string): Maybe.Maybe<Date> {
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

    return Maybe.map2(
        hours,
        minutes,
        (hours, minutes) =>
            new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                hours,
                minutes,
                0,
                0
            )
    )
}

export function dateDifference(a: Date, b: Date): number {
    const a_ = new Date(
        a.getFullYear(),
        a.getMonth(),
        a.getDay(),
        a.getHours(),
        a.getMinutes()
    )

    const b_ = new Date(
        b.getFullYear(),
        b.getMonth(),
        b.getDay(),
        b.getHours(),
        b.getMinutes()
    )

    return a_.getTime() - b_.getTime()
}

export function timeDifferenceToString(difference: number): string {
    const totalSeconds = Math.floor(difference / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)

    const minutes = totalMinutes % 60
    const hours = totalHours % 24

    return dateToString(
        new Date(
            2020, 1, 1,
            hours, minutes,
        )
    )
}

export function upperCaseFirst(string: string): string {
    return string[0].toUpperCase() + string.substring(1)
}

export function assertNever(never: never): void {

}

export function deepEquality(a: any, b: any): boolean {
    if (a instanceof Array && b instanceof Array) {
        return a.every((x, i) => deepEquality(x, b[i]))
    }

    if (typeof a === "object" && typeof b === "object") {
        return Object.entries(a).every(([k, v]) => deepEquality(v, b[k]))
    }

    return a === b
}

import * as Maybe from './Maybe'

/** RGBA, each channel in [0, 1] */
export type Rgba = {
    r: number,
    g: number,
    b: number,
    a: number
}

export function rgba(r: number, g: number, b: number, a: number): Rgba {
    return { r, g, b, a }
}

export function toCssString(color: Rgba): string {
    return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a})`
}

/** https://bottosson.github.io/posts/oklab/ */
export function oklab(lightness: number, greenRed: number, blueYellow: number): Rgba {
    const [L, a, b] = [lightness, greenRed, blueYellow]

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    return {
        r: + 4.0767245293 * l - 3.3072168827 * m + 0.2307590544 * s,
        g: - 1.2681437731 * l + 2.6093323231 * m - 0.3411344290 * s,
        b: - 0.0041119885 * l - 0.7034763098 * m + 1.7068625689 * s,
        a: 1.0
    }
}

export function withAlpha(rgba: Rgba, a: number): Rgba {
    return { ...rgba, a }
}

export function castRgba(json: any): Maybe.Maybe<Rgba> {
    if (typeof json === "object"
        && typeof json.r === "number"
        && typeof json.g === "number"
        && typeof json.b === "number"
        && typeof json.a === "number"
    )
        return Maybe.just({
            r: json.r,
            g: json.g,
            b: json.b,
            a: json.a
        })
    return Maybe.nothing()
}


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


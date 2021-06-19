import * as Maybe from './Maybe'
import * as Utils from './Utils'

export function append<A>(array: Array<A>, element: A): Array<A> {
    return [ ...array, element ]
}

export function intersperse<A>(array: Array<A>, element: A): Array<A> {
    return array.reduce(
        (accum, value) => [...accum, element, value],
        Utils.id<Array<A>>([])
    ).slice(1)
}

export function mapNotNull<A, B>(array: Array<A>, fn: (a: A) => B | null): Array<B> {
    const newArray: Array<B> = []
    const l = array.length

    for (let i = 0; i < l; i ++) {
        const x = fn(array[i])

        if (x !== null) {
            newArray.push(x)
        }
    }

    return newArray
}

export function filterMap<A, B>(array: Array<A>, fn: (a: A) => Maybe.Maybe<B>): Array<B> {
    const newArray: Array<B> = []
    const l = array.length

    for (let i = 0; i < l; i++) {
        fn(array[i]).map(x => newArray.push(x))
    }

    return newArray
}

export function groupWhile<A>(
    array: Array<A>,
    compare: (a: A, b: A) => boolean
): Array<[A, ...Array<A>]> {
    const length = array.length

    const newArray: Array<[A, ...Array<A>]> = []

    let i = 0

    while (i < length) {
        const group: [A, ...Array<A>] = [array[i]]
        i = i + 1

        while (i < length && compare(array[i - 1], array[i])) {
            group.push(array[i])
            i = i + 1
        }

        newArray.push(group)
    }

    return newArray
}

export function map2<A, B, C>(
    as: Array<A>,
    bs: Array<B>,
    fn: (a: A, b: B) => C
): Array<C> {
    const cs = []
    const length = Math.min(as.length, bs.length)

    for (let i = 0; i < length; i++) {
        cs.push(fn(as[i], bs[i]))
    }

    return cs
}

export function decodeJson<A>(
    json: unknown,
    decodeElement: (json: unknown) => Maybe.Maybe<A>
): Maybe.Maybe<Array<A>> {
    if (json instanceof Array) {
        const decoded = filterMap(json, decodeElement)

        if (json.length === decoded.length) {
            return Maybe.just(decoded)
        }
    }
    return Maybe.nothing()
}

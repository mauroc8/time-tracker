import * as Maybe from "./Maybe"
import * as Array_ from "./Array"

export type SortedArray<A> =
    { tag: "SortedArray", array: Array<A> }

type Compare<A> =
    (a: A, b: A) => -1 | 0 | 1

export function fromArray<A>(array: Array<A>, compare: Compare<A>): SortedArray<A> {
    return { tag: "SortedArray", array: array.slice().sort(compare) }
}

export function of<A>(element: A, compare: Compare<A>): SortedArray<A> {
    return fromArray([element], compare)
}

export function empty<A>(compare: Compare<A>): SortedArray<A> {
    return fromArray([], compare)
}

export function add<A>(sorted: SortedArray<A>, element: A, compare: Compare<A>): SortedArray<A> {
    return fromArray<A>([...sorted.array, element], compare)
}

export function flatMap<A, B>(sorted: SortedArray<A>, fn: (a: A) => SortedArray<B>, compare: Compare<B>): SortedArray<B> {
    return fromArray(sorted.array.flatMap(elem => fn(elem).array), compare)
}

export function filter<A>(sorted: SortedArray<A>, fn: (a: A) => boolean, compare: Compare<A>): SortedArray<A> {
    return fromArray(sorted.array.filter(fn), compare)
}

export function map<A, B>(sorted: SortedArray<A>, fn: (a: A) => B, compare: Compare<B>): SortedArray<B> {
    return fromArray(sorted.array.map(fn), compare)
}

export function decodeJson<A>(
    json: unknown,
    decodeElement: (json: unknown) => Maybe.Maybe<A>,
    compare: Compare<A>,
): Maybe.Maybe<SortedArray<A>> {
    if (typeof json === 'object' && json !== null) {
        const json_ =
            json as { tag?: unknown, array?: unknown }


        if (json_.tag === "SortedArray") {
            return Array_.decodeJson(json_.array, decodeElement)
                .map(array => fromArray(array, compare))
        }
    }
    return Maybe.nothing()
}

import * as Maybe from './Maybe'
import * as Array_ from './Array'
import * as Codec from './Codec'
import * as Utils from './Utils'

export type SortedArray<A> =
    { tag: 'SortedArray', toArray: Array<A> }

export function codec<A>(codec: Codec.Codec<A>, compare: Compare<A>): Codec.Codec<SortedArray<A>> {
    return Codec.map(
        Codec.object2(
            'tag', Codec.literal('SortedArray'),
            'toArray', Codec.array(codec),
        ),
        sorted => fromArray(sorted.toArray, compare),
        Utils.id
    )
}

export type Compare<A> =
    (a: A, b: A) => -1 | 0 | 1

export function fromArray<A>(array: Array<A>, compare: Compare<A>): SortedArray<A> {
    return { tag: 'SortedArray', toArray: array.slice().sort(compare) }
}

export function of<A>(element: A): SortedArray<A> {
    return { tag: 'SortedArray', toArray: [element] }
}

export function empty<A>(): SortedArray<A> {
    return { tag: 'SortedArray', toArray: [] }
}

export function add<A>(sorted: SortedArray<A>, element: A, compare: Compare<A>): SortedArray<A> {
    return fromArray<A>([...sorted.toArray, element], compare)
}

export function flatMap<A, B>(sorted: SortedArray<A>, fn: (a: A) => SortedArray<B>, compare: Compare<B>): SortedArray<B> {
    return fromArray(sorted.toArray.flatMap(elem => fn(elem).toArray), compare)
}

export function filter<A>(sorted: SortedArray<A>, fn: (a: A) => boolean): SortedArray<A> {
    return { tag: 'SortedArray', toArray: sorted.toArray.filter(fn) }
}

export function map<A, B>(sorted: SortedArray<A>, fn: (a: A) => B, compare: Compare<B>): SortedArray<B> {
    return fromArray(sorted.toArray.map(fn), compare)
}

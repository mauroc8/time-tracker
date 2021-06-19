
import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Array_ from './Array'

export type NonemptyArray<A> = [A, ...Array<A>]

/** Like `groupWhile` but preserving non-emptyness. */
export function groupWhile<A>(
    array: NonemptyArray<A>,
    compare: (a: A, b: A) => boolean
): NonemptyArray<NonemptyArray<A>> {
    return Array_.groupWhile(array, compare) as NonemptyArray<NonemptyArray<A>>
}

/** Like `Array.prototype.map` but knowing that the nonempty constraint is preserved. */
export function map<A, B>(
    array: NonemptyArray<A>,
    mapFn: (a: A) => B
): NonemptyArray<B> {
    return array.map(mapFn) as NonemptyArray<B>
}

import * as Maybe from './Maybe'

export function intersperse<A>(array: Array<A>, element: A): Array<A> {
    return array.reduce(
        (accum, value) => [...accum, element, value],
        ([] as Array<A>)
    ).slice(1)
}

export function filterMap<A, B>(array: Array<A>, fn: (a: A) => Maybe.Maybe<B>): Array<B> {
    const newArray: Array<B> = []
    const l = array.length

    for (let i = 0; i < l; i++) {
        fn(array[i])?.map(x => newArray.push(x))
    }

    return newArray
}

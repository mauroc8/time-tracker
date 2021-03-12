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

export function groupWhile<A>(array: Array<A>, compare: (a: A, b: A) => boolean): Array<Array<A>> {
    const length = array.length;

    if (length === 1) {
        return [array];
    } else {
        const newArray: Array<Array<A>> = []

        let i = 0

        while (i < length) {
            const group: Array<A> = [array[i]]

            while (i + 1 < length) {
                if (compare(array[i], array[i + 1])) {
                    group.push(array[i + 1])
                    i = i + 1
                } else {
                    i = i + 1
                    break;
                }
            }

            newArray.push(group)
        }

        return newArray
    }
}

import * as Maybe from './Maybe'
import * as Array_ from './Array'
import * as Pair from './Pair'

export function upperCaseFirst(string: string): string {
    return string[0].toUpperCase() + string.substring(1)
}

export function assertNever(never: never): void {
    console.warn(`Value of tipe never`, never)
}

/** Structural equality */
export function equals(a: unknown, b: unknown): boolean {
    if (a instanceof Array && b instanceof Array) {
        return a.every((x, i) => equals(x, b[i]))
    }


    if (typeof a === "object" && typeof b === "object") {
        if (a === null || b === null) {
            return a === b;
        } else {
            const aEntries =
                Object.entries(a)

            const bEntries =
                Object.entries(b)

            const sortFunction =
                (a: [string, any], b: [string, any]) =>
                    compareStrings(Pair.first(a), Pair.first(b))

            return aEntries.length === bEntries.length
                && Array_.map2(
                    aEntries.sort(sortFunction),
                    bEntries.sort(sortFunction),
                    ([aKey, aValue], [bKey, bValue]) =>
                        aKey === bKey && equals(aValue, bValue)
                )
                    .every(x => x)
        }
    }

    return a === b
}

export function compareStrings(a: string, b: string): number {
    if (a < b)
        return -1
    else if (a === b)
        return 0
    else
        return 1
}

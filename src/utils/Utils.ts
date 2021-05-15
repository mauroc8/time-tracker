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
        return a.every((x, i) => equals(x, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        if (a === null || b === null) {
            return a === b;
        }

        for (const [key, value] of Object.entries(a)) {
            if (
                !(key in b)
                    || !equals(
                        value,
                        (b as { [property: string]: unknown })[key]
                    )
            ) {
                return false;
            }
        }

        for (const key of Object.keys(b)) {
            if (!(key in a)) {
                return false;
            }
        }

        return true;
    }

    return a === b;
}

export const eq = (a: unknown) => (b: unknown) => equals(a, b)

export function compareStrings(a: string, b: string): -1 | 0 | 1 {
    if (a < b)
        return -1
    else if (a === b)
        return 0
    else
        return 1
}

export function compareNumbers(a: number, b: number): -1 | 0 | 1 {
    if (a < b) {
        return -1
    }
    if (a === b) {
        return 0
    }
    return 1
}

export function debug<A>(tag: string, value: A): A {
    console.log(tag, value)
    return value
}

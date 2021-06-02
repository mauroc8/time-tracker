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
export function equals<A>(a: A, b: A): boolean {
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
                        (b as unknown as { [property: string]: unknown })[key]
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

export const eq = <A>(a: A) => (b: A) => equals(a, b)

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


export function pipe<A, B>(
    a: A,
    f: (a: A) => B,
): B {
    return f(a)
}

export function pipe2<A, B, C>(
    a: A,
    f: (a: A) => B,
    g: (b: B) => C,
): C {
    return g(f(a))
}

export function pipe3<A, B, C, D>(
    a: A,
    f: (a: A) => B,
    g: (b: B) => C,
    h: (c: C) => D,
): D {
    return h(g(f(a)))
}

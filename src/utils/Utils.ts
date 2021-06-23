import * as Result from "./Result"

export function upperCaseFirst(string: string): string {
    return string[0].toUpperCase() + string.substring(1)
}

export function assertNever(never: never): void {
    console.warn(`Value of tipe never`, never)
}

/** Structural equality */
export function equals<A>(a: A, b: A): boolean {
    if (a === b) {
        return true
    }

    if (a instanceof Array && b instanceof Array) {
        return a.length === b.length && a.every((x, i) => equals(x, b[i]))
    }

    if (isObject(a) && isObject(b)) {
        for (const key of Object.keys(a)) {
            if (!(key in b) || !equals(a[key], b[key])) {
                return false
            }
        }

        for (const key of Object.keys(b)) {
            if (!(key in a)) {
                return false
            }
        }

        return true
    }

    // NaN values are not equal between themselves or each other.
    // Without this, `equals(NaN, NaN)` would return `false`.
    if (Number.isNaN(a) && Number.isNaN(b)) {
        return true;
    }

    return a === b
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

/** Understand some type as a literal.
 * 
 * ```ts
 * let foo = 'bar'
 * > foo : string
 * let foo = literal('bar')
 * > foo : 'bar'
 * ```
*/
export function literal<A extends string | number | null | undefined | boolean>(a: A): A {
    return a
}

/** Take a value and return the same value. This functions gives me the possibility to
 * annotate the type I intend the value to be and thus avoid an unsafe cast.
*/
export function id<A>(a: A): A {
    return a
}

export function isObject(a: unknown): a is { [key: string]: unknown } {
    return typeof a === 'object' && a !== null
}

export function jsonParse(json: string): Result.Result<unknown, unknown> {
    try {
        return Result.ok(JSON.parse(json))
    } catch (error: unknown) {
        return Result.error(error)
    }
}

export function debugError<A>(error: A): void {
    if (process.env.NODE_ENV === 'development') {
        console.error(error)
    }
}

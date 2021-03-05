
// --- Memoize the intermediate results (a la dynamic programming) ---

type Table = {
    array: Array<number | undefined>,
    length: number,
}

function table(a: number, b: number): Table {
    return { array: new Array(a * b), length: a }
}

function get(table: Table, a: number, b: number): number | undefined {
    return table.array[a * table.length + b]
}

function set(table: Table, a: number, b: number, value: number): void {
    table.array[a * table.length + b] = value
}

// --- Levenshtein distance ---


function tail(a: string): string {
    return a.substring(1)
}

export function distance(a: string, b: string): number {
    return lev(table(a.length, b.length), a, b)
}

/** This is the function that matches with the definition at:
 * https://en.wikipedia.org/wiki/Levenshtein_distance#Definition
 */
function lev(table: Table, a: string, b: string,): number {
    const [a_, b_] = [a.length, b.length]

    if (b_ === 0)
        return a_

    if (a_ === 0)
        return b_

    if (a[0] === b[0])
        return lev_(table, tail(a), tail(b))

    return 1 + Math.min(
        lev_(table, tail(a), b),
        lev_(table, a, tail(b)),
        lev_(table, tail(a), tail(b))
    )
}

/** This is the function that memoizes the results in the table
 * to avoid calculating the same result over and over.
 * Mutates the table.
 */
function lev_(table: Table, a: string, b: string,): number {
    const distance = get(table, a.length, b.length)

    if (distance !== undefined) {
        return distance
    } else {
        const distance_ = lev(table, a, b)

        set(table, a.length, b.length, distance_)

        return distance_
    }
}

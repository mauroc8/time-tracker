
export function pair<A, B>(a: A, b: B): [A, B] {
    return [a, b]
}

export function first<A, B>(pair: [A, B]): A {
    return pair[0]
}

export function second<A, B>(pair: [A, B]): B {
    return pair[1]
}

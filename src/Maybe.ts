export interface Maybe<A> {
    withDefault: (value: A) => A
    map: <B>(func: (a: A) => B) => Maybe<B>
    andThen: <B>(func: (a: A) => Maybe<B>) => Maybe<B>
    orElse: (other: Maybe<A>) => Maybe<A>
    toBool: () => boolean
}

export function just<A>(value: A): Maybe<A> {
    return new Just<A>(value)
}

export function nothing<A>(): Maybe<A> {
    return new Nothing<A>()
}

export function map2<A, B, C>(a: Maybe<A>, b: Maybe<B>, fn: (a: A, b: B) => C): Maybe<C> {
    return a.andThen(a_ => b.map(b_ => fn(a_, b_)))
}

export function map3<A, B, C, D>(
    maybeA: Maybe<A>,
    maybeB: Maybe<B>,
    maybeC: Maybe<C>,
    fn: (a: A, b: B, c: C) => D
): Maybe<D> {
    return maybeA.andThen(a =>
        maybeB.andThen(b =>
            maybeC.map(c => fn(a, b, c))))
}

export function fromUndefined<A>(a: A | undefined): Maybe<A> {
    if (a === undefined)
        return nothing()
    else
        return just(a)
}

export class Just<A> implements Maybe<A> {
    tag: string = "just"
    value: A

    constructor(value: A) {
        this.value = value
    }

    withDefault(_: A): A {
        return this.value
    }

    map<B>(func: (a: A) => B): Maybe<B> {
        return new Just(func(this.value))
    }

    andThen<B>(func: (a: A) => Maybe<B>): Maybe<B> {
        return func(this.value)
    }

    orElse(other: Maybe<A>): Maybe<A> {
        return this
    }

    toBool(): boolean {
        return true
    }
}

export class Nothing<A> implements Maybe<A> {
    tag: string = "nothing"

    constructor() { }

    withDefault(value: A): A {
        return value
    }

    map<B>(_: (a: A) => B): Maybe<B> {
        return new Nothing()
    }

    andThen<B>(_: (a: A) => Maybe<B>): Maybe<B> {
        return new Nothing()
    }

    orElse(other: Maybe<A>): Maybe<A> {
        return other
    }

    toBool(): boolean {
        return false
    }
}

export function cast<A>(json: any, castJust: (json: any) => Maybe<A>): Maybe<Maybe<A>> {
    if (typeof json === "object") {
        if (json.tag === "nothing")
            return just(nothing())
        if (json.tag === "just")
            return just(castJust(json.value))
    }
    return nothing()
}

export function combine<A>(maybes: Array<Maybe<A>>): Maybe<Array<A>> {
    return maybes.reduce(
        (maybeArray, maybeItem) =>
            map2(
                maybeArray,
                maybeItem,
                (array, item) => {
                    array.push(item)
                    return array
                }
            ),
        just<Array<A>>([])
    )
}

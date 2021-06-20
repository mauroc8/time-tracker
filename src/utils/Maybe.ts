export interface Maybe<A> {
    tag: "just" | "nothing"
    withDefault(value: A): A
    map<B>(func: (a: A) => B): Maybe<B>
    andThen<B>(func: (a: A) => Maybe<B>): Maybe<B>
    orElse(_: () => Maybe<A>): Maybe<A>
    caseOf<B>(ifJust: (a: A) => B, ifNothing: () => B): B
}

export function just<A>(value: A): Maybe<A> {
    return new Just<A>(value)
}

export function nothing<A>(): Maybe<A> {
    return new Nothing<A>()
}

export function map2<A, B, C>(fn: (a: A, b: B) => C, a: Maybe<A>, b: Maybe<B>): Maybe<C> {
    return a.andThen(a_ => b.map(b_ => fn(a_, b_)))
}

export function map3<A, B, C, D>(
    fn: (a: A, b: B, c: C) => D,
    maybeA: Maybe<A>,
    maybeB: Maybe<B>,
    maybeC: Maybe<C>,
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

export function fromNullable<A>(a: A | null): Maybe<A> {
    if (a === null)
        return nothing()
    else
        return just(a)
}

export function filter<A>(maybe: Maybe<A>, f: (a: A) => boolean): Maybe<A> {
    return maybe.andThen(a => f(a) ? just(a) : nothing())
}

export function caseOf<A, B>(maybe: Maybe<A>, ifJust: (a: A) => B, ifNothing: () => B): B {
    return maybe
        .map(a => () => ifJust(a))
        .withDefault(ifNothing)
        ()
}

class Just<A> implements Maybe<A> {
    public tag: "just" = "just"
    value: A

    constructor(value: A) {
        this.value = value
    }

    caseOf<B>(ifJust: (a: A) => B, _: () => B): B {
        return ifJust(this.value)
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

    orElse(_: () => Maybe<A>): Maybe<A> {
        return this
    }

    toBool(): boolean {
        return true
    }
}

class Nothing<A> implements Maybe<A> {
    public tag: "nothing" = "nothing"

    constructor() { }

    caseOf<B>(_: (a: A) => B, ifNothing: () => B): B {
        return ifNothing()
    }

    withDefault(value: A): A {
        return value
    }

    map<B>(_: (a: A) => B): Maybe<B> {
        return new Nothing()
    }

    andThen<B>(_: (a: A) => Maybe<B>): Maybe<B> {
        return new Nothing()
    }

    orElse(f: () => Maybe<A>): Maybe<A> {
        return f()
    }

    toBool(): boolean {
        return false
    }
}

export function combine<A>(maybes: Array<Maybe<A>>): Maybe<Array<A>> {
    return maybes.reduce(
        (maybeArray, maybeItem) =>
            map2(
                (array, item) => {
                    array.push(item)
                    return array
                },
                maybeArray,
                maybeItem,
            ),
        just<Array<A>>([])
    )
}

export interface Maybe<A> {
    withDefault: (value: A) => A
    map: <B>(func: (a: A) => B) => Maybe<B>
    andThen: <B>(func: (a: A) => Maybe<B>) => Maybe<B>
    orElse: (other: Maybe<A>) => Maybe<A>
}

export function just<A>(value: A) {
    return new Just<A>(value)
}

export function nothing<A>() {
    return new Nothing<A>()
}

export function map2<A, B, C>(a: Maybe<A>, b: Maybe<B>, fn: (a: A, b: B) => C): Maybe<C> {
    return a.andThen(a_ => b.map(b_ => fn(a_, b_)))
}

export function fromUndefined<A>(a: A | undefined): Maybe<A> {
    if (a === undefined)
        return nothing()
    else
        return just(a)
}

class Just<A> implements Maybe<A> {
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
}

class Nothing<A> implements Maybe<A> {
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
}
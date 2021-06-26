export interface MaybeInterface<A> {
    withDefault(value: A): A
    map<B>(func: (a: A) => B): Maybe<B>
    andThen<B>(func: (a: A) => Maybe<B>): Maybe<B>
    orElse(func: () => Maybe<A>): Maybe<A>
    caseOf<B>(ifJust: (a: A) => B, ifNothing: () => B): B
}

export type Maybe<A> =
    | { tag: 'just', value: A } & MaybeInterface<A>
    | { tag: 'nothing' } & MaybeInterface<A>

export function just<A>(value: A): Maybe<A> {
    return {
        tag: 'just',
        value,
        withDefault: _ => value,
        map: f => just(f(value)),
        andThen: f => f(value),
        orElse: _ => just(value),
        caseOf: (f, _) => f(value),
    }
}

export function nothing<A>(): Maybe<A> {
    return {
        tag: 'nothing',
        withDefault: x => x,
        map: nothing,
        andThen: nothing,
        orElse: f => f(),
        caseOf: (_, f) => f(),
    }
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
    return maybe.caseOf(ifJust, ifNothing)
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

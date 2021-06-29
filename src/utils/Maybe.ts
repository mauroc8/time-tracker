
export type Maybe<A> =
    | { tag: 'just', value: A }
    | { tag: 'nothing' }

/** A Maybe<A> that implements the Maybe.Interface<A> and thus has methods
 * that can be called in a "pipeline" style.
*/
export type Interface<A> = Maybe<A> & {
    withDefault(value: A): A,
    map<B>(func: (a: A) => B): Interface<B>,
    andThen<B>(func: (a: A) => Maybe<B>): Interface<B>,
    orElse(func: () => Maybe<A>): Interface<A>,
    caseOf<B>(ifJust: (a: A) => B, ifNothing: () => B): B,
}

export function just<A>(value: A): Interface<A> {
    return {
        tag: 'just',
        value,
        withDefault: _ => value,
        map: f => just(f(value)),
        andThen: f => withInterface(f(value)),
        orElse: _ => just(value),
        caseOf: (f, _) => f(value),
    }
}

export function nothing<A>(): Interface<A> {
    return {
        tag: 'nothing',
        withDefault: x => x,
        map: nothing,
        andThen: nothing,
        orElse: f => withInterface(f()),
        caseOf: (_, f) => f(),
    }
}

export function withInterface<A>(maybe: Maybe<A>): Interface<A> {
    if (maybe.tag === 'just') {
        return just(maybe.value)
    }

    return nothing()
}

export function map2<A, B, C>(
    fn: (a: A, b: B) => C,
    a: Maybe<A>,
    b: Maybe<B>
): Interface<C> {
    if (a.tag === 'just' && b.tag === 'just') {
        return just(fn(a.value, b.value))
    }

    return nothing()
}

export function map3<A, B, C, D>(
    fn: (a: A, b: B, c: C) => D,
    maybeA: Maybe<A>,
    maybeB: Maybe<B>,
    maybeC: Maybe<C>,
): Interface<D> {
    if (maybeA.tag === 'just' && maybeB.tag === 'just' && maybeC.tag === 'just') {
        return just(fn(maybeA.value, maybeB.value, maybeC.value))
    }

    return nothing()
}

export function fromUndefined<A>(a: A | undefined): Interface<A> {
    if (a === undefined)
        return nothing()
    else
        return just(a)
}

export function fromNullable<A>(a: A | null): Interface<A> {
    if (a === null)
        return nothing()
    else
        return just(a)
}

export function filter<A>(maybe: Maybe<A>, f: (a: A) => boolean): Interface<A> {
    if (maybe.tag === 'just') {
        if (!f(maybe.value)) {
            return nothing()
        }
    }

    return withInterface(maybe)
}

export function caseOf<A, B>(maybe: Maybe<A>, ifJust: (a: A) => B, ifNothing: () => B): B {
    if (maybe.tag === 'just') {
        return ifJust(maybe.value)
    }

    return ifNothing()
}

export function combine<A>(maybes: Array<Maybe<A>>): Interface<Array<A>> {
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

import * as Maybe from './Maybe'

type ResultInterface<A, E> = {
    map: <B>(fn: (a: A) => B) => Result<B, E>,
    andThen: <B>(fn: (a: A) => Result<B, E>) => Result<B, E>,
    mapError: <F>(fn: (e: E) => F) => Result<A, F>,
    withDefault: (default_: A) => A,
    withDefaultLazy: (default_: () => A) => A,
    caseOf: <B>(mapValue: (a: A) => B, mapError: (e: E) => B) => B,
    orElse: <F>(fn: (e: E) => Result<A, F>) => Result<A, F>,
}

export type Result<A, E> =
    | { tag: 'ok'; value: A } & ResultInterface<A, E>
    | { tag: 'error'; error: E } & ResultInterface<A, E>

export function ok<A, E>(value: A): Result<A, E> {
    return {
        tag: 'ok',
        value,
        map: fn => ok(fn(value)),
        andThen: fn => fn(value),
        mapError: _ => ok(value),
        withDefault: _ => value,
        withDefaultLazy: _ => value,
        caseOf: (fn, _) => fn(value),
        orElse: _ => ok(value)
    }
}

export function error<A, E>(err: E): Result<A, E> {
    return {
        tag: 'error',
        error: err,
        map: _ => error(err),
        andThen: _ => error(err),
        mapError: fn => error(fn(err)),
        withDefault: default_ => default_,
        withDefaultLazy: f => f(),
        caseOf: (_, fn) => fn(err),
        orElse: fn => fn(err),
    }
}

export function map2<A, B, C, E>(
    resultA: Result<A, E>,
    resultB: Result<B, E>,
    fn: (a: A, b: B) => C
): Result<C, E> {
    return resultA.andThen(a =>
        resultB.map(b => fn(a, b))
    )
}

export function andMap<A, B, E>(
    wrappedFunction: Result<(a: A) => B, E>,
    wrappedValue: Result<A, E>,
): Result<B, E> {
    if (wrappedFunction.tag === 'ok') {
        return wrappedValue.tag === 'ok'
            ? ok(wrappedFunction.value(wrappedValue.value))
            : error(wrappedValue.error)
    }
    return error(wrappedFunction.error)
}

export function toMaybe<A, E>(result: Result<A, E>): Maybe.Maybe<A> {
    return result.tag === 'ok' ? Maybe.just(result.value) : Maybe.nothing()
}

export function fromMaybe<A, E>(err: E, maybe: Maybe.Maybe<A>): Result<A, E> {
    return maybe
        .map(a => ok<A, E>(a))
        .withDefault(error(err))
}

export function collect<A, E>(array: Array<Result<A, E>>): Result<Array<A>, E> {
    return array.reduce(
        (previousValue, currentValue) =>
            map2(
                previousValue,
                currentValue,
                (array, element) =>
                    [ ...array, element ]
            ),
        ok<Array<A>, E>([])
    )
}

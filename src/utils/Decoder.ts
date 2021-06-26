import * as Result from './Result'
import * as Utils from './Utils'
import * as Maybe from './Maybe'
import * as Array_ from './Array'
import * as Pair from './Pair'

// https://package.elm-lang.org/packages/elm/json/latest/Json-Decode

export type Decoder<A> =
    { tag: 'Decoder', decoder: (a: Utils.Json) => Result.Result<A, Error> }

export function decode<A>(a: Utils.Json, decoder: Decoder<A>): Result.Result<A, Error> {
    return decoder.decoder(a)
}

function decoder<A>(decoder: (a: Utils.Json) => Result.Result<A, Error>): Decoder<A> {
    return { tag: 'Decoder', decoder }
}

export const string: Decoder<string> =
    decoder(
        (a: Utils.Json) =>
            typeof a === 'string'
                ? Result.ok<string, Error>(a)
                : Result.error<string, Error>({ tag: 'expectingString', found: a })
    )

export const boolean: Decoder<boolean> =
    decoder(
        (a: Utils.Json) =>
            typeof a === 'boolean'
                ? Result.ok<boolean, Error>(a)
                : Result.error<boolean, Error>({ tag: 'expectingBoolean', found: a })
    )

export const number: Decoder<number> =
    decoder(
        (a: Utils.Json) =>
            typeof a === 'number'
                ? Result.ok<number, Error>(a)
                : Result.error<number, Error>({ tag: 'expectingNumber', found: a })
    )

export function literal<A extends string | number | boolean | null | undefined>(literal: A): Decoder<A> {
    return decoder(
        (a: Utils.Json) =>
            a === literal
                ? Result.ok<A, Error>(literal)
                : Result.error<A, Error>({ tag: 'expectingLiteral', literal, found: a })
    )
}

export const null_: Decoder<null> =
    literal<null>(null)

export function array<A>(elementDecoder: Decoder<A>): Decoder<Array<A>> {
    return decoder(
        (as: Utils.Json) =>
            as instanceof Array
                ? Result.collect(
                    as.map(
                        (a, index) =>
                            decode(a, elementDecoder)
                                .mapError<Error>(error => ({ tag: 'atArrayIndex', index, error, found: a }))
                    )
                  )
                : Result.error<Array<A>, Error>({ tag: 'expectingArray', found: as })
    )
}

export function property<A>(propertyName: string, propertyDecoder: Decoder<A>): Decoder<A> {
    return decoder(
        (a: Utils.Json) =>
            Utils.isObject(a)
                ? decode(a[propertyName], propertyDecoder)
                    .mapError<Error>(error => ({ tag: 'atObjectProperty', propertyName, error, found: a[propertyName] }))
                : Result.error<A, Error>({ tag: 'expectingObject', found: a })
    )
}

export function index<A>(index: number, elementDecoder: Decoder<A>): Decoder<A> {
    return decoder(
        (as: Utils.Json) =>
            as instanceof Array
                ? decode(as[index], elementDecoder)
                    .mapError<Error>(error => ({ tag: 'atArrayIndex', index, error, found: as[index] }))
                : Result.error<A, Error>({ tag: 'expectingArray', found: as })
    )
}

export function oneOf<A>(decoder_: Decoder<A>, ...decoders: Array<Decoder<A>>): Decoder<A> {
    return decoder(
        (a: Utils.Json) =>
            decoders.reduce(
                (previousResult, currentDecoder) =>
                    previousResult.caseOf(
                        a => Result.ok(a),
                        _ => decode(a, currentDecoder)
                    ),
                decode(a, decoder_)
            )
    )
}

export type Error =
    | { tag: 'expectingString', found: Utils.Json }
    | { tag: 'expectingBoolean', found: Utils.Json }
    | { tag: 'expectingNumber', found: Utils.Json }
    | { tag: 'expectingLiteral', literal: unknown, found: Utils.Json }
    | { tag: 'expectingArray', found: Utils.Json }
    | { tag: 'atArrayIndex', index: number, error: Error, found: Utils.Json }
    | { tag: 'expectingObject', found: Utils.Json }
    | { tag: 'atObjectProperty', propertyName: string, error: Error, found: Utils.Json }
    | { tag: 'message', message: string, found: Utils.Json }

export function errorToString(error: Error): string {
    switch (error.tag) {
        case 'expectingString':
            return 'Expecting a string'
        case 'expectingBoolean':
            return 'Expecting a boolean'
        case 'expectingNumber':
            return 'Expecting a number'
        case 'expectingLiteral':
            return `Expecting the literal ${JSON.stringify(error.literal)}`
        case 'expectingArray':
            return 'Expecting an array'
        case 'atArrayIndex':
            return `${errorToString(error.error)} in <array>[${error.index}]`
        case 'expectingObject':
            return 'Expecting an object'
        case 'atObjectProperty':
            const [properties, error_] = joinConsecutivePropertyAccessErrors(error.propertyName, error.error)
            return `${errorToString(error_)} at <object>.${properties.join('.')}`
        case 'message':
            return error.message
    }
}

function joinConsecutivePropertyAccessErrors(property: string, error: Error): [Array<string>, Error] {
    if (error.tag === 'atObjectProperty') {
        const [properties, error_] = joinConsecutivePropertyAccessErrors(error.propertyName, error.error)

        return [
            [property, ...properties],
            error_
        ]
    }

    return [[property], error]
}

export function map<A, B>(decoder_: Decoder<A>, mapFunction: (a: A) => B): Decoder<B> {
    return decoder(
        (x: Utils.Json) =>
            decode(x, decoder_)
                .map(mapFunction)
    )
}

export function map2<A, B, C>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    mapFunction: (a: A, b: B) => C
): Decoder<C> {
    return decoder(
        (x: Utils.Json) =>
            Result.map2(
                decode(x, decoderA),
                decode(x, decoderB),
                mapFunction
            )
    )
}

export function andMap<A, B>(
    decoderFunction: Decoder<(a: A) => B>,
    decoderArgument: Decoder<A>
): Decoder<B> {
    return map2(decoderFunction, decoderArgument, (fn, arg) => fn(arg))
}

export function andThen<A, B>(decoder_: Decoder<A>, func: (a: A) => Decoder<B>): Decoder<B> {
    return decoder(
        (x: Utils.Json) =>
            decode(x, decoder_).andThen(
                a => decode(x, func(a))
            )
    )
}


export function map3<A, B, C, D>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    mapFunction: (a: A, b: B, c: C) => D
): Decoder<D> {
    return map2(
        decoderA,
        map2(
            decoderB,
            decoderC,
            Pair.pair
        ),
        (a, [b, c]) => mapFunction(a, b, c)
    )
}

export function map4<A, B, C, D, E>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    mapFunction: (a: A, b: B, c: C, d: D) => E
): Decoder<E> {
    return map3(
        decoderA,
        decoderB,
        map2(
            decoderC,
            decoderD,
            Pair.pair
        ),
        (a, b, [c, d]) => mapFunction(a, b, c, d)
    )
}

export function map5<A, B, C, D, E, F>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    mapFunction: (a: A, b: B, c: C, d: D, e: E) => F
): Decoder<F> {
    return map4(
        decoderA,
        decoderB,
        decoderC,
        map2(
            decoderD,
            decoderE,
            Pair.pair
        ),
        (a, b, c, [d, e]) => mapFunction(a, b, c, d, e)
    )
}

export function map6<A, B, C, D, E, F, G>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    mapFunction: (a: A, b: B, c: C, d: D, e: E, f: F) => G
): Decoder<G> {
    return map5(
        decoderA,
        decoderB,
        decoderC,
        decoderD,
        map2(
            decoderE,
            decoderF,
            Pair.pair
        ),
        (a, b, c, d, [e, f]) => mapFunction(a, b, c, d, e, f)
    )
}

export function map7<A, B, C, D, E, F, G, H>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
    mapFunction: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => H
): Decoder<H> {
    return map6(
        decoderA,
        decoderB,
        decoderC,
        decoderD,
        decoderE,
        map2(
            decoderF,
            decoderG,
            Pair.pair
        ),
        (a, b, c, d, e, [f, g]) => mapFunction(a, b, c, d, e, f, g)
    )
}

export function map8<A, B, C, D, E, F, G, H, I>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
    decoderH: Decoder<H>,
    mapFunction: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => I
): Decoder<I> {
    return map7(
        decoderA,
        decoderB,
        decoderC,
        decoderD,
        decoderE,
        decoderF,
        map2(
            decoderG,
            decoderH,
            Pair.pair
        ),
        (a, b, c, d, e, f, [g, h]) => mapFunction(a, b, c, d, e, f, g, h)
    )
}

export function map9<A, B, C, D, E, F, G, H, I, J>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
    decoderH: Decoder<H>,
    decoderI: Decoder<I>,
    mapFunction: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => J
): Decoder<J> {
    return map8(
        decoderA,
        decoderB,
        decoderC,
        decoderD,
        decoderE,
        decoderF,
        decoderG,
        map2(
            decoderH,
            decoderI,
            Pair.pair
        ),
        (a, b, c, d, e, f, g, [h, i]) => mapFunction(a, b, c, d, e, f, g, h, i)
    )
}

export function succeed<A>(a: A): Decoder<A> {
    return decoder((_) => Result.ok(a))
}

export function fail<A>(message: string): Decoder<A> {
    return decoder(a => Result.error<A, Error>({ tag: 'message', message, found: a }))
}

export function maybe<A>(decoder_: Decoder<A>): Decoder<Maybe.Maybe<A>> {
    return oneOf(
        map(
            property('tag', literal('nothing')),
            _ => Maybe.nothing()
        ),
        map2(
            property('tag', literal('just')),
            property('value', decoder_),
            (_, value) => Maybe.just(value)
        )
    )
}

export function object<
    KeyA extends string,
    A,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
): Decoder<
    { [key in KeyA]: A }
> {
    return map(
        property<A>(keyA, decoderA),
        (valueA) =>
            ({
                [keyA]: valueA,
            } as any)
    )
}   

export function object2<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
> {
    return map2(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        (valueA, valueB) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
            } as any)
    )
}

export function object3<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
> {
    return map3(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        (valueA, valueB, valueC) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
            } as any)
    )
}

export function object4<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
> {
    return map4(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        (valueA, valueB, valueC, valueD) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
            } as any)
    )
}

export function object5<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
    KeyE extends string,
    E,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
    keyE: KeyE,
    decoderE: Decoder<E>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
        & { [key in KeyE]: E }
> {
    return map5(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        property<E>(keyE, decoderE),
        (valueA, valueB, valueC, valueD, valueE) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
                [keyE]: valueE,
            } as any)
    )
}

export function object6<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
    KeyE extends string,
    E,
    KeyF extends string,
    F,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
    keyE: KeyE,
    decoderE: Decoder<E>,
    keyF: KeyF,
    decoderF: Decoder<F>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
        & { [key in KeyE]: E }
        & { [key in KeyF]: F }
> {
    return map6(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        property<E>(keyE, decoderE),
        property<F>(keyF, decoderF),
        (valueA, valueB, valueC, valueD, valueE, valueF) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
                [keyE]: valueE,
                [keyF]: valueF,
            } as any)
    )
}

export function object7<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
    KeyE extends string,
    E,
    KeyF extends string,
    F,
    KeyG extends string,
    G,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
    keyE: KeyE,
    decoderE: Decoder<E>,
    keyF: KeyF,
    decoderF: Decoder<F>,
    keyG: KeyG,
    decoderG: Decoder<G>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
        & { [key in KeyE]: E }
        & { [key in KeyF]: F }
        & { [key in KeyG]: G }
> {
    return map7(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        property<E>(keyE, decoderE),
        property<F>(keyF, decoderF),
        property<G>(keyG, decoderG),
        (valueA, valueB, valueC, valueD, valueE, valueF, valueG) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
                [keyE]: valueE,
                [keyF]: valueF,
                [keyG]: valueG,
            } as any)
    )
}

export function object8<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
    KeyE extends string,
    E,
    KeyF extends string,
    F,
    KeyG extends string,
    G,
    KeyH extends string,
    H,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
    keyE: KeyE,
    decoderE: Decoder<E>,
    keyF: KeyF,
    decoderF: Decoder<F>,
    keyG: KeyG,
    decoderG: Decoder<G>,
    keyH: KeyH,
    decoderH: Decoder<H>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
        & { [key in KeyE]: E }
        & { [key in KeyF]: F }
        & { [key in KeyG]: G }
        & { [key in KeyH]: H }
> {
    return map8(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        property<E>(keyE, decoderE),
        property<F>(keyF, decoderF),
        property<G>(keyG, decoderG),
        property<H>(keyH, decoderH),
        (valueA, valueB, valueC, valueD, valueE, valueF, valueG, valueH) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
                [keyE]: valueE,
                [keyF]: valueF,
                [keyG]: valueG,
                [keyH]: valueH,
            } as any)
    )
}


export function object9<
    KeyA extends string,
    A,
    KeyB extends string,
    B,
    KeyC extends string,
    C,
    KeyD extends string,
    D,
    KeyE extends string,
    E,
    KeyF extends string,
    F,
    KeyG extends string,
    G,
    KeyH extends string,
    H,
    KeyI extends string,
    I,
>(
    keyA: KeyA,
    decoderA: Decoder<A>,
    keyB: KeyB,
    decoderB: Decoder<B>,
    keyC: KeyC,
    decoderC: Decoder<C>,
    keyD: KeyD,
    decoderD: Decoder<D>,
    keyE: KeyE,
    decoderE: Decoder<E>,
    keyF: KeyF,
    decoderF: Decoder<F>,
    keyG: KeyG,
    decoderG: Decoder<G>,
    keyH: KeyH,
    decoderH: Decoder<H>,
    keyI: KeyI,
    decoderI: Decoder<I>,
): Decoder<
    { [key in KeyA]: A }
        & { [key in KeyB]: B }
        & { [key in KeyC]: C }
        & { [key in KeyD]: D }
        & { [key in KeyE]: E }
        & { [key in KeyF]: F }
        & { [key in KeyG]: G }
        & { [key in KeyH]: H }
        & { [key in KeyI]: I }
> {
    return map9(
        property<A>(keyA, decoderA),
        property<B>(keyB, decoderB),
        property<C>(keyC, decoderC),
        property<D>(keyD, decoderD),
        property<E>(keyE, decoderE),
        property<F>(keyF, decoderF),
        property<G>(keyG, decoderG),
        property<H>(keyH, decoderH),
        property<I>(keyI, decoderI),
        (valueA, valueB, valueC, valueD, valueE, valueF, valueG, valueH, valueI) =>
            ({
                [keyA]: valueA,
                [keyB]: valueB,
                [keyC]: valueC,
                [keyD]: valueD,
                [keyE]: valueE,
                [keyF]: valueF,
                [keyG]: valueG,
                [keyH]: valueH,
                [keyI]: valueI,
            } as any)
    )
}



export function union2<
    A,
    B,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
): Decoder<A | B> {
    return decoder(
        data =>
            decoderA
                .decoder(data)
                .map<A | B>(x => x)
                .orElse(_ =>
                    decoderB
                        .decoder(data)
                        .map<A | B>(x => x)    
                )
    )
}

export function union3<
    A,
    B,
    C,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
): Decoder<A | B | C> {
    return union2(
        union2(decoderA, decoderB),
        decoderC,
    )
}

export function union4<
    A,
    B,
    C,
    D,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
): Decoder<A | B | C | D> {
    return union2(
        union2(decoderA, decoderB),
        union2(decoderC, decoderD),
    )
}

export function union5<
    A,
    B,
    C,
    D,
    E,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
): Decoder<A | B | C | D | E> {
    return union2(
        union2(decoderA, decoderB),
        union3(decoderC, decoderD, decoderE),
    )
}

export function union6<
    A,
    B,
    C,
    D,
    E,
    F,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
): Decoder<A | B | C | D | E | F> {
    return union2(
        union3(decoderA, decoderB, decoderC),
        union3(decoderD, decoderE, decoderF),
    )
}

export function union7<
    A,
    B,
    C,
    D,
    E,
    F,
    G,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
): Decoder<A | B | C | D | E | F | G> {
    return union2(
        union3(decoderA, decoderB, decoderC),
        union4(decoderD, decoderE, decoderF, decoderG),
    )
}

export function union8<
    A,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
    decoderH: Decoder<H>,
): Decoder<A | B | C | D | E | F | G | H> {
    return union2(
        union4(decoderA, decoderB, decoderC, decoderD),
        union4(decoderE, decoderF, decoderG, decoderH),
    )
}

export function union9<
    A,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
>(
    decoderA: Decoder<A>,
    decoderB: Decoder<B>,
    decoderC: Decoder<C>,
    decoderD: Decoder<D>,
    decoderE: Decoder<E>,
    decoderF: Decoder<F>,
    decoderG: Decoder<G>,
    decoderH: Decoder<H>,
    decoderI: Decoder<I>,
): Decoder<A | B | C | D | E | F | G | H | I> {
    return union2(
        union4(decoderA, decoderB, decoderC, decoderD),
        union5(decoderE, decoderF, decoderG, decoderH, decoderI),
    )
}

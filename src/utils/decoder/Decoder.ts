import * as Result from '../Result'
import * as Utils from '../Utils'
import * as Maybe from '../Maybe'
import * as Array_ from '../Array'
import * as Pair from '../Pair'

// https://package.elm-lang.org/packages/elm/json/latest/Json-Decode

export type Decoder<A> =
    { tag: 'Decoder', decoder: (a: unknown) => Result.Result<A, Error> }

export function decode<A>(a: unknown, decoder: Decoder<A>): Result.Result<A, Error> {
    return decoder.decoder(a)
}

function decoder<A>(decoder: (a: unknown) => Result.Result<A, Error>): Decoder<A> {
    return { tag: 'Decoder', decoder }
}

export const string: Decoder<string> =
    decoder(
        (a: unknown) =>
            typeof a === 'string'
                ? Result.ok<string, Error>(a)
                : Result.error<string, Error>({ tag: 'expectingString' })
    )

export const boolean: Decoder<boolean> =
    decoder(
        (a: unknown) =>
            typeof a === 'boolean'
                ? Result.ok<boolean, Error>(a)
                : Result.error<boolean, Error>({ tag: 'expectingBoolean' })
    )

export const number: Decoder<number> =
    decoder(
        (a: unknown) =>
            typeof a === 'number'
                ? Result.ok<number, Error>(a)
                : Result.error<number, Error>({ tag: 'expectingNumber' })
    )

export function literal<A>(literal: A): Decoder<A> {
    return decoder(
        (a: unknown) =>
            a === literal
                ? Result.ok<A, Error>(literal)
                : Result.error<A, Error>({ tag: 'expectingLiteral', literal })
    )
}

export const null_: Decoder<null> =
    literal<null>(null)

export function array<A>(elementDecoder: Decoder<A>): Decoder<Array<A>> {
    return decoder(
        (as: unknown) =>
            as instanceof Array
                ? Result.collect(
                    as.map(
                        (a, index) =>
                            decode(a, elementDecoder)
                                .mapError<Error>(error => ({ tag: 'atArrayIndex', index, error }))
                    )
                  )
                : Result.error<Array<A>, Error>({ tag: 'expectingArray' })
    )
}

export function property<A>(propertyName: string, propertyDecoder: Decoder<A>): Decoder<A> {
    return decoder(
        (a: unknown) =>
            typeof a === 'object' && a !== null
                ? decode((a as any)[propertyName], propertyDecoder)
                    .mapError<Error>(error => ({ tag: 'atObjectProperty', propertyName, error }))
                : Result.error<A, Error>({ tag: 'expectingObject' })
    )
}

export function index<A>(index: number, elementDecoder: Decoder<A>): Decoder<A> {
    return decoder(
        (as: unknown) =>
            as instanceof Array
                ? decode(as[index], elementDecoder)
                    .mapError<Error>(error => ({ tag: 'atArrayIndex', index, error }))
                : Result.error<A, Error>({ tag: 'expectingArray' })
    )
}

export function oneOf<A>(decoder_: Decoder<A>, ...decoders: Array<Decoder<A>>): Decoder<A> {
    return decoder(
        (a: unknown) =>
            decoders.reduce(
                (previousResult, currentDecoder) =>
                    previousResult.match(
                        a => Result.ok(a),
                        _ => decode(a, currentDecoder)
                    ),
                decode(a, decoder_)
            )
    )
}


export type Error =
    | { tag: 'expectingString' }
    | { tag: 'expectingBoolean' }
    | { tag: 'expectingNumber' }
    | { tag: 'expectingLiteral', literal: unknown }
    | { tag: 'expectingArray' }
    | { tag: 'atArrayIndex', index: number, error: Error }
    | { tag: 'expectingObject' }
    | { tag: 'atObjectProperty', propertyName: string, error: Error }
    | { tag: 'message', message: string }

export function errorToString(error: Error): string {
    switch (error.tag) {
        case 'expectingString':
            return 'Expecting a string'
        case 'expectingBoolean':
            return 'Expecting a boolean'
        case 'expectingNumber':
            return 'Expecting a number'
        case 'expectingLiteral':
            return `Expecting the literal value '${error.literal}'`
        case 'expectingArray':
            return 'Expecting an array'
        case 'atArrayIndex':
            return `${errorToString(error.error)} at array index ${error.index}`
        case 'expectingObject':
            return 'Expecting an object'
        case 'atObjectProperty':
            return `${errorToString(error.error)} at object property '${error.propertyName}'`
        case 'message':
            return error.message
    }
}

export function map<A, B>(decoder_: Decoder<A>, mapFunction: (a: A) => B): Decoder<B> {
    return decoder(
        (x: unknown) =>
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
        (x: unknown) =>
            Result.map2(
                decode(x, decoderA),
                decode(x, decoderB),
                mapFunction
            )
    )
}

export function andThen<A, B>(decoder_: Decoder<A>, func: (a: A) => Decoder<B>): Decoder<B> {
    return decoder(
        (x: unknown) =>
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

export function succeed<A>(a: A): Decoder<A> {
    return decoder((_) => Result.ok(a))
}

export function  fail<A>(message: string): Decoder<A> {
    return decoder((_) => Result.error<A, Error>({ tag: 'message', message }))
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

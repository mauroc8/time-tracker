import * as Decoder from './Decoder'
import * as Maybe from './Maybe'
import * as Utils from './Utils'

// https://package.elm-lang.org/packages/miniBill/elm-codec/latest/Codec <3

export type Codec<A> = {
    type: 'Codec',
    decoder: Decoder.Decoder<A>,
    encode: (x: A) => Utils.Json,
}

const id = <A>(x: A) => x

export const string: Codec<string> = {
    type: 'Codec',
    decoder: Decoder.string,
    encode: id,
}

export const bool: Codec<boolean> = {
    type: 'Codec',
    decoder: Decoder.boolean,
    encode: id,
}

export const number: Codec<number> = {
    type: 'Codec',
    decoder: Decoder.number,
    encode: id,
}

export const null_: Codec<null> = {
    type: 'Codec',
    decoder: Decoder.null_,
    encode: id,
}

export function array<A>(codec: Codec<A>): Codec<A[]> {
    return {
        type: 'Codec',
        decoder: Decoder.array(codec.decoder),
        encode: (x: A[]) => x.map(codec.encode),
    }
}

type Literal = string | number | boolean | null

export function literal<A extends Literal>(x: A): Codec<A> {
    return {
        type: 'Codec',
        decoder: Decoder.literal(x),
        encode: _ => x,
    }
}

export function map<A, B>(
    codec: Codec<A>,
    f: (a: A) => B,
    g: (b: B) => A,
): Codec<B> {
    return {
        type: 'Codec',
        decoder: Decoder.map(codec.decoder, f),
        encode: x => codec.encode(g(x))
    }
}

export function andThen<A, B>(
    codec: Codec<A>,
    f: (a: A) => Codec<B>,
    g: (b: B) => A
): Codec<B> {
    return {
        type: 'Codec',
        decoder: Decoder.andThen(codec.decoder, x => f(x).decoder),
        encode: b => codec.encode(g(b))
    }
}

export function struct<A>(
    properties: { [K in keyof A]: Codec<A[K]> }
): Codec<{ [K in keyof A]: A[K] }> {
    const propertyDecoders: { [K in keyof A]: Decoder.Decoder<A[K]> } = {} as any

    for (const key in properties) if (Object.prototype.hasOwnProperty.call(properties, key)) {
        propertyDecoders[key] = properties[key].decoder
    }

    return {
        type: 'Codec',
        decoder: Decoder.struct(propertyDecoders),
        encode: struct => {
            const encodedStruct: Utils.Json = {}
            
            for (const key in properties) if (Object.prototype.hasOwnProperty.call(properties, key)) {
                encodedStruct[key] = properties[key].encode(struct[key])
            }

            return encodedStruct
        }
    }
}

export function union2<A, B>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    match: <X>(x: A | B, caseA: (a: A) => X, caseB: (b: B) => X) => X,
): Codec<A | B> {
    return {
        type: 'Codec',
        decoder: Decoder.union2(codecA.decoder, codecB.decoder),
        encode: x => match(x, codecA.encode, codecB.encode)
    }
}

export function union3<A, B, C>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    match: <X>(
        x: A | B | C,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
    ) => X,
    ): Codec<A | B | C> {
    return {
        type: 'Codec',
        decoder: Decoder.union3(codecA.decoder, codecB.decoder, codecC.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode)
    }
}

export function union4<A, B, C, D>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    match: <X>(
        x: A | B | C | D,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
    ) => X,
    ): Codec<A | B | C | D> {
    return {
        type: 'Codec',
        decoder: Decoder.union4(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode)
    }
}

export function union5<A, B, C, D, E>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    codecE: Codec<E>,
    match: <X>(
        x: A | B | C | D | E,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
        caseE: (y: E) => X,
    ) => X,
    ): Codec<A | B | C | D | E> {
    return {
        type: 'Codec',
        decoder: Decoder.union5(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder, codecE.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode, codecE.encode)
    }
}

export function union6<A, B, C, D, E, F>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    codecE: Codec<E>,
    codecF: Codec<F>,
    match: <X>(
        x: A | B | C | D | E | F,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
        caseE: (y: E) => X,
        caseF: (y: F) => X,
    ) => X,
    ): Codec<A | B | C | D | E | F> {
    return {
        type: 'Codec',
        decoder: Decoder.union6(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder, codecE.decoder, codecF.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode, codecE.encode, codecF.encode)
    }
}

export function union7<A, B, C, D, E, F, G>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    codecE: Codec<E>,
    codecF: Codec<F>,
    codecG: Codec<G>,
    match: <X>(
        x: A | B | C | D | E | F | G,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
        caseE: (y: E) => X,
        caseF: (y: F) => X,
        caseG: (y: G) => X,
    ) => X,
    ): Codec<A | B | C | D | E | F | G> {
    return {
        type: 'Codec',
        decoder: Decoder.union7(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder, codecE.decoder, codecF.decoder, codecG.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode, codecE.encode, codecF.encode, codecG.encode)
    }
}

export function union8<A, B, C, D, E, F, G, H>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    codecE: Codec<E>,
    codecF: Codec<F>,
    codecG: Codec<G>,
    codecH: Codec<H>,
    match: <X>(
        x: A | B | C | D | E | F | G | H,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
        caseE: (y: E) => X,
        caseF: (y: F) => X,
        caseG: (y: G) => X,
        caseH: (y: H) => X,
    ) => X,
    ): Codec<A | B | C | D | E | F | G | H> {
    return {
        type: 'Codec',
        decoder: Decoder.union8(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder, codecE.decoder, codecF.decoder, codecG.decoder, codecH.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode, codecE.encode, codecF.encode, codecG.encode, codecH.encode)
    }
}

export function union9<A, B, C, D, E, F, G, H, I>(
    codecA: Codec<A>,
    codecB: Codec<B>,
    codecC: Codec<C>,
    codecD: Codec<D>,
    codecE: Codec<E>,
    codecF: Codec<F>,
    codecG: Codec<G>,
    codecH: Codec<H>,
    codecI: Codec<I>,
    match: <X>(
        x: A | B | C | D | E | F | G | H | I,
        caseA: (y: A) => X,
        caseB: (y: B) => X,
        caseC: (y: C) => X,
        caseD: (y: D) => X,
        caseE: (y: E) => X,
        caseF: (y: F) => X,
        caseG: (y: G) => X,
        caseH: (y: H) => X,
        caseI: (y: I) => X,
    ) => X,
    ): Codec<A | B | C | D | E | F | G | H | I> {
    return {
        type: 'Codec',
        decoder: Decoder.union9(codecA.decoder, codecB.decoder, codecC.decoder, codecD.decoder, codecE.decoder, codecF.decoder, codecG.decoder, codecH.decoder, codecI.decoder),
        encode: x => match(x, codecA.encode, codecB.encode, codecC.encode, codecD.encode, codecE.encode, codecF.encode, codecG.encode, codecH.encode, codecI.encode)
    }
}

export function succeed<A>(value: A): Codec<A> {
    return {
        type: 'Codec',
        decoder: Decoder.succeed(value),
        encode: _ => null,
    }
}

export function fail<A>(message: string): Codec<A> {
    return {
        type: 'Codec',
        decoder: Decoder.fail(message),
        encode: _ => null,
    }
}

// I need to study this because it's way more verbose than I'd like
export function maybe<A>(codec: Codec<A>): Codec<Maybe.Maybe<A>> {
    return map(
        union2(
            struct({
                tag: literal('just'),
                value: codec,
            }),
            struct({ tag: literal('nothing') }),
            (x, just, nothing) => {
                switch (x.tag) {
                    case 'just':
                        return just(x)
                    case 'nothing':
                        return nothing(x)
                }
            }
        ),
        x => {
            switch (x.tag) {
                case 'just':
                    return Maybe.just(x.value)
                case 'nothing':
                    return Maybe.nothing()
            }
        },
        Utils.id,
    )
}

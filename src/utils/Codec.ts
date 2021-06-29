import * as Decoder from './Decoder'
import * as Maybe from './Maybe'
import * as Utils from './Utils'

// https://package.elm-lang.org/packages/miniBill/elm-codec/latest/Codec <3

export type Codec<A> = {
    type: 'Codec',
    decoder: Decoder.Decoder<A>,
    encode: (x: A) => Utils.Json,
} & Interface<A>

export interface Interface<A> {
    map<B>(
        f: (a: A) => B,
        g: (b: B) => A
    ): Codec<B>

    andThen<B>(
        f: (a: A) => Codec<B>,
        g: (b: B) => A
    ): Codec<B>
}

function codecOf<A>(decoder: Decoder.Decoder<A>, encode: (x: A) => Utils.Json): Codec<A> {
    return {
        type: 'Codec',
        decoder,
        encode,
        map: (f, g) =>
            codecOf(
                Decoder.map(decoder, f),
                x => encode(g(x)),
            ),
        andThen: (f, g) =>
            codecOf(
                Decoder.andThen(decoder, x => f(x).decoder),
                b => encode(g(b))
            )
    }
}

export const string: Codec<string> = codecOf(
    Decoder.string,
    Utils.id,
)

export const bool: Codec<boolean> = codecOf(
    Decoder.boolean,
    Utils.id,
)

export const number: Codec<number> = codecOf(
    Decoder.number,
    Utils.id,
)

export const null_: Codec<null> = codecOf(
    Decoder.null_,
    Utils.id,
)

export function array<A>(codec: Codec<A>): Codec<A[]> {
    return codecOf(
        Decoder.array(codec.decoder),
        (x: A[]) => x.map(codec.encode),
    )
}

type Literal = string | number | boolean | null

export function literal<A extends Literal>(x: A): Codec<A> {
    return codecOf(
        Decoder.literal(x),
        _ => x,
    )
}

export function map<A, B>(
    codec: Codec<A>,
    f: (a: A) => B,
    g: (b: B) => A
): Codec<B> {
    return codec.map(f, g)
}

export function andThen<A, B>(
    codec: Codec<A>,
    f: (a: A) => Codec<B>,
    g: (b: B) => A
): Codec<B> {
    return codec.andThen(f, g)
}

function getStructDecoders<A>(
    codecStruct: { [K in keyof A]: Codec<A[K]> }
): { [K in keyof A]: Decoder.Decoder<A[K]> } {
    const propertyDecoders: { [K in keyof A]: Decoder.Decoder<A[K]> } = {} as any

    for (const key in codecStruct) if (Utils.hasOwnProperty(codecStruct, key)) {
        propertyDecoders[key] = codecStruct[key].decoder
    }

    return propertyDecoders
}

function encodeStruct<A>(struct: A, properties: { [K in keyof A]: Codec<A[K]> }): Utils.Json {
    const encodedStruct: Utils.Json = {}
            
    for (const key in properties) if (Utils.hasOwnProperty(properties, key)) {
        encodedStruct[key] = properties[key].encode(struct[key])
    }

    return encodedStruct
}

export function struct<A>(
    properties: { [K in keyof A]: Codec<A[K]> }
): Codec<{ [K in keyof A]: A[K] }> {
    const structDecoders = getStructDecoders(properties)

    return codecOf(
        Decoder.struct(structDecoders),
        struct => encodeStruct(struct, properties),
    )
}

function getVariantsDecoders2<A>(
    variants: {
        [K in keyof A]: [
            (x: A[keyof A]) => A[K] | null,
            Codec<A[K]>,
        ]
    }
): { [K in keyof A]: Decoder.Decoder<A[K]> } {
    const decoders: { [K in keyof A]: Decoder.Decoder<A[K]> } =
        {} as any
    
    for (const key in variants) if (Utils.hasOwnProperty(variants, key)) {
        decoders[key] = variants[key][1].decoder
    }

    return decoders
}

function encodeVariants<A>(
    x: A[keyof A],
    variants: {
        [K in keyof A]: [
            (x: A[keyof A]) => A[K] | null,
            Codec<A[K]>,
        ]
    }
): Utils.Json {
    for (const key in variants) if (Utils.hasOwnProperty(variants, key)) {
        const y = variants[key][0](x)

        if (y !== null) {
            return variants[key][1].encode(y)
        }
    }

    return null
}

export function union<A>(
    variants: {
        [K in keyof A]: [
            (x: A[keyof A]) => A[K] | null,
            Codec<A[K]>,
        ]
    }
): Codec<A[keyof A]> {
    return codecOf(
        Decoder.union(getVariantsDecoders2(variants)),
        x => encodeVariants(x, variants)
    )
}

export function union2<A, B>(
    asA: (x: A | B) => A | null, codecA: Codec<A>,
    asB: (x: A | B) => B | null, codecB: Codec<B>,
): Codec<A | B> {
    return codecOf(
        Decoder.union2(codecA.decoder, codecB.decoder),
        x =>
            Utils.nullMap(codecA.encode, asA(x))
                ?? Utils.nullMap(codecB.encode, asB(x))
                ?? null
    )
}

export function succeed<A>(value: A): Codec<A> {
    return codecOf(
        Decoder.succeed(value),
        _ => null,
    )
}

export function fail<A>(message: string): Codec<A> {
    return codecOf(
        Decoder.fail(message),
        _ => null,
    )
}

export function maybe<A>(codec: Codec<A>): Codec<Maybe.Interface<A>> {
    return union({
        a: [
            x => x.tag === 'just' ? x : null,
            struct({
                tag: literal('just'),
                value: codec,
            }),
        ],
        b: [
            x => x.tag === 'nothing' ? x : null,
            struct({ tag: literal('nothing') }),
        ],
    })
        .map(Maybe.withInterface, Utils.id)
}

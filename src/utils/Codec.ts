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

    return {
        type: 'Codec',
        decoder: Decoder.struct(structDecoders),
        encode: struct => encodeStruct(struct, properties),
    }
}

export function union2<A, B>(
    asA: (x: A | B) => A | null, codecA: Codec<A>,
    asB: (x: A | B) => B | null, codecB: Codec<B>,
): Codec<A | B> {
    return {
        type: 'Codec',
        decoder: Decoder.union2(codecA.decoder, codecB.decoder),
        encode: x =>
            Utils.nullMap(codecA.encode, asA(x))
                ?? Utils.nullMap(codecB.encode, asB(x))
                ?? null
    }
}

export function union3<A, B, C>(
    asA: (x: A | B | C) => A | null, codecA: Codec<A>,
    asB: (x: A | B | C) => B | null, codecB: Codec<B>,
    asC: (x: A | B | C) => C | null, codecC: Codec<C>,
): Codec<A | B | C> {
    return {
        type: 'Codec',
        decoder: Decoder.union3(codecA.decoder, codecB.decoder, codecC.decoder),
        encode: x =>
            Utils.nullMap(codecA.encode, asA(x))
                ?? Utils.nullMap(codecB.encode, asB(x))
                ?? Utils.nullMap(codecC.encode, asC(x))
                ?? null
    }
}

export function union4<A, B, C, D>(
    asA: (x: A | B | C | D) => A | null, codecA: Codec<A>,
    asB: (x: A | B | C | D) => B | null, codecB: Codec<B>,
    asC: (x: A | B | C | D) => C | null, codecC: Codec<C>,
    asD: (x: A | B | C | D) => D | null, codecD: Codec<D>,
): Codec<A | B | C | D> {
    return union2(
        x => asA(x) || asB(x), union2(asA, codecA, asB, codecB),
        x => asC(x) || asD(x), union2(asC, codecC, asD, codecD),
    )
}

function getVariantsDecoders<A>(
    variantsStruct: { [Variant in keyof A]: { [Prop in keyof A[Variant]]: Codec<A[Variant][Prop]> } }
): { [Variant in keyof A]: { [Prop in keyof A[Variant]]: Decoder.Decoder<A[Variant][Prop]> } } {
    const variantsDecoders: { [Variant in keyof A]: { [Prop in keyof A[Variant]]: Decoder.Decoder<A[Variant][Prop]> } } =
        {} as any

    for (const key in variantsStruct) if (Utils.hasOwnProperty(variantsStruct, key)) {
        variantsDecoders[key as keyof A] = getStructDecoders(variantsStruct[key as keyof A])
    }

    return variantsDecoders
}

export function taggedUnion<
    Tag extends string,    
    A,
    Output extends { [Variant in keyof A]: { [tag in Tag]: Variant } & A[Variant] }
>(
    tag: Tag,
    variants: { [Variant in keyof A]: { [Prop in keyof A[Variant]]: Codec<A[Variant][Prop]> } },
): Codec<Output[keyof Output]> {
    return {
        type: 'Codec',
        decoder: Decoder.taggedUnion(tag, getVariantsDecoders(variants)),
        encode: (union: Output[keyof Output]) => {
            for (const tagVariant in variants) if (Utils.hasOwnProperty(variants, tagVariant)) {
                if (tagVariant as keyof A === union[tag] as any) {
                    const payload = struct(variants[tagVariant as keyof A]).encode(union as any)

                    if (Utils.isObject(payload)) {
                        return {
                            [tag]: tagVariant,
                            ...payload
                        }
                    }

                    return null
                }
            }

            return null
        }
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
            x => x.tag === 'just' ? x : null,
            struct({
                tag: literal('just'),
                value: codec,
            }),
            x => x.tag === 'nothing' ? x : null,
            struct({ tag: literal('nothing') }),
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

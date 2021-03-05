import * as Maybe from '../utils/Maybe'

type Color =
    | Rgba
    | Hex

/** RGBA, each channel in [0, 1] */
type Rgba = {
    tag: "Rgba",
    r: number,
    g: number,
    b: number,
    a: number
}

export function rgba(r: number, g: number, b: number, a: number): Color {
    return { tag: "Rgba", r, g, b, a }
}

export function rgba255(r: number, g: number, b: number, a: number): Color {
    return { tag: "Rgba", r: r / 255, g: g / 255, b: b / 255, a }
}

export function withAlpha(rgba: Rgba, a: number): Color {
    return { ...rgba, a }
}

type Hex = {
    tag: "Hex", hex: string
}

export function hex(hex: string): Color {
    return { tag: "Hex", hex }
}

type Hsl = {
    tag: "Hsl",
    h: number,
    s: number,
    l: number,
}

export function toCssString(color: Color): string {
    switch (color.tag) {
        case "Rgba":
            return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a})`
        case "Hex":
            return `#${color.hex}`
    }
}


export function decode(json: any): Maybe.Maybe<Color> {
    if (typeof json === "object"
        && typeof json.r === "number"
        && typeof json.g === "number"
        && typeof json.b === "number"
        && typeof json.a === "number"
    )
        return Maybe.just(rgba(json.r, json.g, json.b, json.a))

    if (typeof json === "object"
        && typeof json.hex === "string"
    )
        return Maybe.just(hex(json.hex))

    return Maybe.nothing()
}


/** Application colors
 * 
 */

export const black = hex('000000')
export const gray50 = hex('0C0C0C')
export const gray100 = hex('141414')
export const gray200 = hex('222222')
export const gray700 = hex('B1B1B1')
export const white = hex('FFFFFF')

export const violet = hex('7F8BF8')

export const background = gray100
export const accent = violet

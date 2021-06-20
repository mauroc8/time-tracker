import * as Maybe from '../utils/Maybe'

// Color

export type Color =
    | Rgba
    | Hex
    | Hsl

export function toCssString(color: Color): string {
    switch (color.tag) {
        case "Rgba":
            return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a})`
        case "Hex":
            return `#${color.hex}`
        case "Hsl":
            return `hsl(${color.h}, ${Math.floor(color.s * 100)}%, ${Math.floor(color.l * 100)}%)`
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

// --- Rgba

type Rgba = {
    tag: "Rgba",
    r: 0 | number | 1,
    g: 0 | number | 1,
    b: 0 | number | 1,
    a: 0 | number | 1
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

// Hex

type Hex = {
    tag: "Hex", hex: string
}

export function hex(hex: string): Color {
    return { tag: "Hex", hex }
}

// Hsl

type Hsl = {
    tag: "Hsl",
    h: 0 | number | 360,
    s: 0 | number | 1,
    l: 0 | number | 1,
}

export function hsl(h: 0 | number | 360, s: 0 | number | 1, l: 0 | number | 1): Color {
    return {
        tag: "Hsl",
        h, s, l
    }
}

/** Useful colors:
 */

export const text = hsl(0, 0, 0.57)
export const background = hsl(0, 0, 0.08)
export const accent = hex('7F8BF8')
export const accent70 = hex('414cb5')
export const accent50 = hex('2d3582')

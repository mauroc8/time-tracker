import * as Maybe from '../utils/Maybe'

// Color

export type Color =
    | Rgba
    | Hex
    | Hsl

export function toCssString(color: Color): string {
    switch (color.tag) {
        case 'Rgba':
            return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${color.a})`
        case 'Hex':
            return `#${color.hex.join('')}`
        case 'Hsl':
            return `hsl(${color.h}, ${Math.floor(color.s * 100)}%, ${Math.floor(color.l * 100)}%)`
    }
}

// --- Rgba

type Rgba = {
    tag: 'Rgba',
    r: 0 | number | 1,
    g: 0 | number | 1,
    b: 0 | number | 1,
    a: 0 | number | 1
}

export function rgba(r: number, g: number, b: number, a: number): Color {
    return { tag: 'Rgba', r, g, b, a }
}

export function rgba255(r: number, g: number, b: number, a: number): Color {
    return { tag: 'Rgba', r: r / 255, g: g / 255, b: b / 255, a }
}

export function withAlpha(rgba: Rgba, a: number): Color {
    return { ...rgba, a }
}

// Hex (hexadecimal)

type Hex = {
    tag: 'Hex', hex: [HexDigit, HexDigit, HexDigit, HexDigit, HexDigit, HexDigit]
}

type HexDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export function hex(...hex: [HexDigit, HexDigit, HexDigit, HexDigit, HexDigit, HexDigit]): Color {
    return { tag: 'Hex', hex }
}

// Hsl

type Hsl = {
    tag: 'Hsl',
    h: 0 | number | 360,
    s: 0 | number | 1,
    l: 0 | number | 1,
}

export function hsl(h: 0 | number | 360, s: 0 | number | 1, l: 0 | number | 1): Color {
    return {
        tag: 'Hsl',
        h, s, l
    }
}

/** Useful colors:
 */

export const text = hsl(0, 0, 0.55)
export const background = hsl(0, 0, 0.08)
export const accent = hex('7', 'F', '8', 'B', 'F', '8')
export const accent70 = hex('4', '1', '4', 'C', 'B', '5')
export const accent50 = hex('2', 'D', '3', '5', '8', '2')

export const transparent = rgba(0, 0, 0, 0)

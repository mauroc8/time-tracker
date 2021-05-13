import * as Html from "../vdom/Html"

// --- Css

export type Css =
    { [selector: string]: { [property: string]: string } }

export function class_(className: string, body: { [property: string]: string }): Css {
    return { [`.${className}`]: body }
}

export function selector(selector: string, body: { [property: string]: string }): Css {
    return { [selector]: body }
}

export function merge(a: Css, b: Css): Css {
    return { ...a, ...b }
}

export function empty(): Css {
    return {}
}

export function toString(css: Css): string {
    return Object.entries(css)
        .map(
            ([selector, body]) => `${selector} {\n${withIndentation(bodyToString(body))}\n}`
        )
        .join('\n\n');
}

function withIndentation(string: string): string {
    return '  '
        + string
            .replaceAll(
                '\n',
                '\n  '
            )
}

export function toHtml<A>(css: Css): Html.Html<A> {
    return Html.node("style", [], [Html.text(toString(css))]);
}

function bodyToString(body: { [property: string]: string }): string {
    return Object.entries(body)
        .map(
            ([property, value]) => `${property}: ${value};`
        )
        .join('\n')
}

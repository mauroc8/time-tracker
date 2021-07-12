import * as Html from "../vdom/Html"

export type Css<Classes extends string> = {
    type: 'Css',
    statements: Array<{
        selector: Selector<Classes>,
        properties: Array<[string, string]>,
    }>
}

export function css<Classes extends string>(
    ...statements: Array<{
        selector: Selector<Classes>,
        properties: Array<[string, string]>,
    }>
): Css<Classes> {
    return {
        type: 'Css',
        statements,
    }
}

export function statement<Classes extends string>(
    selector: Selector<Classes>,
    properties: Array<[string, string]>,
): Css<Classes> {
    return css({
        selector,
        properties,
    })
}

export function toHtml<Classes extends string>(
    css_: Css<Classes>,
): Html.Html<never> {
    return Html.node("style", [], [Html.text(toString(css_))])
}

export function toString<Classes extends string>(
    css_: Css<Classes>,
): string {
    return css_.statements.reduce(
        (stringCss, { selector, properties }) =>
            `${stringCss}\n${selectorToString(selector)}{${propertiesToString(properties)}}`,
        ''
    )
}

function propertiesToString(properties: Array<[string, string]>): string {
    return properties.map(([name_, value]) => `${name_}:${value};`).join('')
}

// --- SELECTOR

export type Selector<Classes extends string> =
    | { tag: 'class', className: Classes, pseudoClass: null | 'hover' | 'focus' | 'active' }
    | { tag: 'tag', tagName: string, pseudoClass: null | string }
    | { tag: 'or', selector0: Selector<Classes>, selector1: Selector<Classes> }
    | { tag: 'directChild', selector0: Selector<Classes>, selector1: Selector<Classes> }
    | { tag: 'child', selector0: Selector<Classes>, selector1: Selector<Classes> }

function selectorToString<Classes extends string>(
    selector: Selector<Classes>,
): string {
    switch (selector.tag) {
        case 'class':
            return `${selector.className}${selector.pseudoClass ? `:${selector.pseudoClass}` : ''}`
        case 'tag':
            return `${selector.tagName}${selector.pseudoClass ? `:${selector.pseudoClass}` : ''}`
        case 'or':
            return `${selectorToString(selector.selector0)},${selectorToString(selector.selector1)}`
        case 'directChild':
            return `${selectorToString(selector.selector0)}>${selectorToString(selector.selector1)}`
        case 'child':
            return `${selectorToString(selector.selector0)} ${selectorToString(selector.selector1)}`
    }
}

export const Selectors = {
    class_<Classes extends string>(
        className: Classes,
        pseudoClass: null | 'hover' | 'focus' | 'active' = null,
    ): Selector<Classes> {
        return {
            tag: 'class',
            className,
            pseudoClass,
        }
    },
    /** TODO This is actually used as an escape hatch for raw css. */
    tag<Classes extends string>(
        tagName: string,
        pseudoClass: null | string = null,
    ): Selector<Classes> {
        return {
            tag: 'tag',
            tagName,
            pseudoClass,
        }
    },
    or<Classes extends string>(
        selector0: Selector<Classes>,
        selector1: Selector<Classes>,
    ): Selector<Classes> {
        return {
            tag: 'or',
            selector0,
            selector1,
        }
    },
    directChild<Classes extends string>(
        selector0: Selector<Classes>,
        selector1: Selector<Classes>,
    ): Selector<Classes> {
        return {
            tag: 'directChild',
            selector0,
            selector1,
        }
    },
    child<Classes extends string>(
        selector0: Selector<Classes>,
        selector1: Selector<Classes>,
    ): Selector<Classes> {
        return {
            tag: 'child',
            selector0,
            selector1,
        }
    },
}

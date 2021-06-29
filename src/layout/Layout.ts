import * as Html from '../vdom/Html'
import * as Color from '../style/Color'
import * as Utils from '../utils/Utils'

import './Layout.css'
import { pair } from '../utils/Pair'

// --- Css

type Css =
    | { pseudoClass: 'normal' | 'hover' | 'focus' | 'parentHover' | 'parentFocus', class: string, content: string }
    | { pseudoClass: 'groupHover' | 'groupFocus', groupClass: string, class: string, content: string }

function cssSelector(css: Css): string {
    switch (css.pseudoClass) {
        case 'normal':
            return `.${css.class}`
        case 'hover':
            return `.${css.class}:hover`
        case 'focus':
            return `.${css.class}:focus`
        case 'parentHover':
            return `*:hover > ${css.class}`
        case 'parentFocus':
            return `*:focus > ${css.class}`
        case 'groupHover':
            return `${css.groupClass}:hover > ${css.class}`
        case 'groupFocus':
            return `${css.groupClass}:focus > ${css.class}`
    }
}

function cssArrayToDict(css: Array<Css>): { [selector: string]: string } {
    const cssDict: { [selector: string]: string } = {}

    for (const css_ of css) {
        cssDict[cssSelector(css_)] = css_.content
    }

    return cssDict
}

export function css<E, C>(
    config: {
        className: string,
        normal?: Array<CssProperty>,
        hover?: Array<CssProperty>,
        focus?: Array<CssProperty>,
        parentHover?: Array<CssProperty>,
        parentFocus?: Array<CssProperty>,
        group?: {
            className: string,
            hover?: Array<CssProperty>,
            focus?: Array<CssProperty>,
        },
    },
): Attribute<E, C> {
    const css: Array<Css> = []

    if (config.normal) {
        css.push(simpleCss('normal', config.className, config.normal))
    }
    if (config.hover) {
        css.push(simpleCss('hover', config.className, config.hover))
    }
    if (config.focus) {
        css.push(simpleCss('focus', config.className, config.focus))
    }
    if (config.parentHover) {
        css.push(simpleCss('parentHover', config.className, config.parentHover))
    }
    if (config.parentFocus) {
        css.push(simpleCss('parentFocus', config.className, config.parentFocus))
    }
    if (config.group) {
        if (config.group.hover) {
            css.push(groupCss(
                'groupHover',
                config.group.className,
                config.className,
                config.group.hover
            ))
        }
        if (config.group.focus) {
            css.push(groupCss(
                'groupFocus',
                config.group.className,
                config.className,
                config.group.focus
            ))
        }
    }

    return {
        tag: 'css',
        css,
    }
}

export function simpleCss(
    pseudoClass: 'normal' | 'hover' | 'focus' | 'parentHover' | 'parentFocus',
    className: string,
    properties: Array<CssProperty>,
): Css {
    return {
        pseudoClass,
        class: className,
        content: propertiesToString(properties)
    }
}

export function groupCss(
    pseudoClass: 'groupHover' | 'groupFocus',
    groupClass: string,
    className: string,
    properties: Array<CssProperty>,
): Css {
    return {
        pseudoClass,
        groupClass,
        class: className,
        content: propertiesToString(properties)
    }
}

type CssProperty =
    | { tag: 'property', name: string, value: string }
    | { tag: 'batch', properties: Array<CssProperty> }

export function cssProperty(name: string, value: string): CssProperty {
    return { tag: 'property', name, value }
}

export function batch(properties: Array<CssProperty>): CssProperty {
    return { tag: 'batch', properties }
}

function propertiesToString(properties: Array<CssProperty>): string {
    return properties.map(propertyToString).join(';')
}

function propertyToString(property: CssProperty): string {
    switch (property.tag) {
        case 'property':
            return `${property.name}:${property.value}`
        case 'batch':
            return propertiesToString(property.properties)
    }
}

// --- Styled Html


type StyledHtml<E> =
    { html: Html.Html<E>, css: Array<Css> }

function mapStyledHtml<A, B>(styled: StyledHtml<A>, f: (a: A) => B): StyledHtml<B> {
    return {
        html: Html.map(styled.html, f),
        css: styled.css
    }
}

function collectChildrenCss<E, C>(
    context: C,
    children: Array<Layout<E, C>>
): { htmlChildren: Array<Html.Html<E>>, css: Array<Css> } {
    return children.map(child => toStyledHtml(context, child))
        .reduce(
            (collected, { html, css }) => {
                collected.htmlChildren.push(html)
                collected.css.push(...css)
                return collected
            },
            Utils.id<{ htmlChildren: Array<Html.Html<E>>, css: Array<Css> }>({ htmlChildren: [], css: [] })
        )
}

function collectNodeCss<E, C>(
    context: C,
    flexDirection: 'row' | 'column',
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
    f: (
        htmlChildren: Array<Html.Html<E>>,
        htmlAttributes: Array<Html.Attribute<E>>,
        css: Array<Css>
    ) => Html.Html<E>
): StyledHtml<E> {
    const { htmlAttributes, css: attributesCss } = toHtmlAttributes(attributes, context, flexDirection)
    const { htmlChildren, css: childrenCss } = collectChildrenCss(context, children)

    const css = [ ...childrenCss, ...attributesCss ]

    return {
        html: f(htmlChildren, htmlAttributes, css),
        css,
    }
}

// --- LAYOUT

/** Helpers to create flexbox layouts with css styles.
*/
export type Layout<Event, Context> = {
    type: 'Layout',
    build: (context: Context) => StyledHtml<Event>,
}
    | Html.Html<Event>

export function toStyledHtml<Event, Context>(
    context: Context,
    layout: Layout<Event, Context>,
): StyledHtml<Event> {
    if (layout.type === 'Layout') {
        return layout.build(context)
    }
    return { html: layout, css: [] }
}

export function toHtml<E, C>(
    context: C,
    flexDirection: 'row' | 'column',
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Html.Html<E> {
    return collectNodeCss(
        context,
        flexDirection,
        attributes,
        children,
        (htmlChildren, htmlAttributes, css) => Html.node(
            htmlTag,
            htmlAttributes,
            [
                Html.keyed(
                    'div',
                    [],
                    Object.entries(cssArrayToDict(css))
                        .map(([selector, content]) =>
                            pair(
                                selector,
                                Html.node(
                                    'style',
                                    [],
                                    [Html.text(content)]
                                )
                            )
                        ),
                ),
                ...htmlChildren
            ],
        ),
    )
        .html
}

export function none<Event, Context>(): Layout<Event, Context> {
    return Html.text('')
}

export function node<E, C>(
    flexDirection: 'row' | 'column',
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return {
        type: 'Layout',
        build: (context: C) => collectNodeCss(
            context,
            flexDirection,
            attributes,
            children,
            (htmlChildren, htmlAttributes) => Html.node(
                htmlTag,
                htmlAttributes,
                htmlChildren,
            ),
        )
    }
}

export function keyed<E, C>(
    flexDirection: 'row' | 'column',
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<[string, Layout<E, C>]>,
): Layout<E, C> {
    return {
        type: 'Layout',
        build: (context: C) => collectNodeCss(
            context,
            flexDirection,
            attributes,
            children.map(([_, child]) => child),
            (htmlChildren, htmlAttributes) => Html.keyed(
                htmlTag,
                htmlAttributes,
                children.map(([key, _], i) => [key, htmlChildren[i]])
            )
        )
    }
}

export function column<E, C>(
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return node(
        'column',
        htmlTag,
        attributes,
        children
    )
}

export function row<E, C>(
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return node(
        'row',
        htmlTag,
        attributes,
        children
    )
}

export function text<E, C>(text: string): Layout<E, C> {
    return Html.text(text)
}

export function space<E, C>(size: number): Layout<E, C> {
    return Html.node(
        'div',
        [
            Html.style('display', 'inline-block'),
            Html.style('width', size + 'px'),
            Html.style('height', size + 'px'),
        ],
        []
    )
}

/** Dibuja al nodo `below` 'flotando' debajo de `above`, como un menú o un tooltip. */
export function below<E, C>(
    flexDirection: 'row' | 'column',
    tagName: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
    below: {
        flexDirection: 'row' | 'column',
        tagName: string,
        attributes: Array<Attribute<E, C>>,
        children: Array<Layout<E, C>>,
    }
): Layout<E, C> {
    return node<E, C>(
        'column',
        tagName,
        [
            ...attributes,
            Html.style('position', 'relative'),
        ],
        [
            ...children,
            node(
                below.flexDirection,
                below.tagName,
                [
                    ...below.attributes,
                    Html.style('position', 'absolute'),
                    Html.style('top', '100%'),
                ],
                below.children
            )
        ]
    )
}

export function usingContext<E, Context>(useContext: (context: Context) => Layout<E, Context>): Layout<E, Context> {
    return {
        type: 'Layout',
        build: context => {
            return toStyledHtml(context, useContext(context))
        }
    }
}

export function map<A, B, C>(layout: Layout<A, C>, f: (a: A) => B): Layout<B, C> {
    return {
        type: 'Layout',
        build: context => mapStyledHtml(toStyledHtml(context, layout), f)
    }
}

// --- ATTRIBUTES

/** Layouts can receive the same attributes from the `Html` module, and also a
 * `Layout.attributeUsingContext` that uses the context to create an `Html.Attribute`.
 */
export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: 'attributeUsingContext', htmlAttribute: (context: Context) => Html.Attribute<Event> }
    | { tag: 'attributeUsingFlexDirection', htmlAttribute: (flexDirection: 'row' | 'column') => Html.Attribute<Event> }
    | { tag: 'css', css: Array<Css> }

/** Use the current context to create a Html attribute.
 * For example, if the context is the color scheme:
 * 
 * ```ts
 * Layout.column(
 *   'div',
 *   [
 *     Layout.useContext(colorScheme => Layout.color(colorScheme.textColor)),
 *     Layout.useContext(colorScheme => Layout.backgroundColor(colorScheme.backgroundColor)),
 *   ],
 *   [
 *     Layout.text('Hello world'),
 *   ]
 * )
 * ```
*/
export function attributeUsingContext<E, Context>(
    htmlAttribute: (context: Context) => Html.Attribute<E>
): Attribute<E, Context> {
    return {
        tag: 'attributeUsingContext',
        htmlAttribute
    }
}

function attributeUsingFlexDirection<E, C>(
    htmlAttribute: (flexDirection: 'row' | 'column') => Html.Attribute<E>
): Attribute<E, C> {
    return {
        tag: 'attributeUsingFlexDirection',
        htmlAttribute
    }
}

function toHtmlAttribute<E, C>(
    attribute: Attribute<E, C>,
    context: C,
    flexDirection: 'row' | 'column'
): { htmlAttribute: Html.Attribute<E>, css: Array<Css> | null } {
    if (attribute.tag === 'attributeUsingContext') {
        return {
            htmlAttribute: attribute.htmlAttribute(context),
            css: null
        }
    }
    if (attribute.tag === 'attributeUsingFlexDirection') {
        return {
            htmlAttribute: attribute.htmlAttribute(flexDirection),
            css: null
        }
    }
    if (attribute.tag === 'css') {
        return {
            htmlAttribute: Html.class_(attribute.css[0]?.class || ''),
            css: attribute.css,
        }
    }
    return {
        htmlAttribute: attribute,
        css: null
    }
}

function toHtmlAttributes<E, C>(
    attributes: Array<Attribute<E, C>>,
    context: C,
    flexDirection: 'row' | 'column'
): { htmlAttributes: Array<Html.Attribute<E>>, css: Array<Css> } {
    const collectedHtmlAttributes = attributes
        .map(attr => toHtmlAttribute(attr, context, flexDirection))
        .reduce(
            (collected, { htmlAttribute, css }) => {
                collected.htmlAttributes.push(htmlAttribute)

                if (css !== null) {
                    collected.css.push(...css)
                }

                return collected
            },
            Utils.id<{ htmlAttributes: Array<Html.Attribute<E>>, css: Array<Css> }>({ htmlAttributes: [], css: [] })
        )

    return {
        htmlAttributes: [
            ...collectedHtmlAttributes.htmlAttributes,
            Html.style('display', 'flex'),
            Html.style('flex-direction', flexDirection),
        ],
        css: collectedHtmlAttributes.css,
    }
}

/** Attributes */

export function spacing<A>(x: number): Html.Attribute<A> {
    return Html.style('gap', `${x}px`)
}

export function padding<A>(x: number): Html.Attribute<A> {
    return Html.style('padding', `${x}px`)
}

export function paddingXY<A>(x: number, y: number): Html.Attribute<A> {
    return Html.style('padding', `${y}px ${x}px`)
}

export function centerX<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'center')
            : Html.style('justify-content', 'center')
    )
}

export function centerY<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'center')
            : Html.style('align-items', 'center')
    )
}

export function endX<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'end')
            : Html.style('justify-content', 'flex-end')
    )
}

export function endY<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'flex-end')
            : Html.style('align-items', 'end')
    )
}

export function startX<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'start')
            : Html.style('justify-content', 'flex-start')
    )
}

export function startY<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'flex-start')
            : Html.style('align-items', 'start')
    )
}

export function baselineY<E, C>(): Attribute<E, C> {
    return attributeUsingFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.class_('')
            : Html.style('align-items', 'baseline')
    )
}

export function color<A>(color: Color.Color): Html.Attribute<A> {
    return Html.style('color', Color.toCssString(color))
}

export function backgroundColor<A>(color: Color.Color): Html.Attribute<A> {
    return Html.style('background-color', Color.toCssString(color))
}

export function border<A>(width: number, color: Color.Color): Html.Attribute<A> {
    return Html.style('border', `${Math.floor(width)}px solid ${Color.toCssString(color)}`)
}

export function grow<A>(grow: number): Html.Attribute<A> {
    return Html.style('flex-grow', `${grow}`)
}

export function shrink<A>(shrink: number): Html.Attribute<A> {
    return Html.style('flex-shrink', `${shrink}`)
}

export function fullWidth<A>(): Html.Attribute<A> {
    return Html.class_('w-full')
}

export function inlineText<A>(text: string): Html.Html<A> {
    return Html.node(
        "div",
        [
            Html.style("display", "inline-flex"),
            Html.style("white-space", "nowrap"),
        ],
        [
            Html.text(text),
        ]
    )
}

export function widthPx<A>(px: number): Html.Attribute<A> {
    return Html.style('width', `${px}px`)
}

export function heightPx<A>(px: number): Html.Attribute<A> {
    return Html.style('height', `${px}px`)
}

export function horizontalGradient<A>(from: Color.Color, to: Color.Color): Html.Attribute<A> {
    return Html.style(
        'background-image',
        `linear-gradient(to right, ${Color.toCssString(from)}, ${Color.toCssString(to)})`
    )
}

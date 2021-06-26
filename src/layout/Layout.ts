import * as Html from '../vdom/Html'
import * as Color from '../style/Color'

import './Layout.css'

// --- LAYOUT

/** Helpers to create flexbox layouts. `Layout` is just Html using flexbox and optionally reading state from a context.
*/
export type Layout<Event, Context> = {
    type: 'Layout',
    build: (context: Context) => Html.Html<Event>,
}
    | Html.Html<Event>

export function toHtml<Event, Context>(
    context: Context,
    layout: Layout<Event, Context>,
): Html.Html<Event> {
    if (layout.type === 'Layout') {
        return layout.build(context)
    }
    return layout
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
        build: (context: C) => Html.node(
            htmlTag,
            [
                ...toHtmlAttributes(attributes, context, flexDirection),
                Html.style('display', 'flex'),
                Html.style('flex-direction', flexDirection),
            ],
            children.map(child => toHtml(context, child))
        ),
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
        build: (context: C) => Html.keyed(
            htmlTag,
            [
                ...toHtmlAttributes(attributes, context, flexDirection),
                Html.style('display', 'flex'),
                Html.style('flex-direction', flexDirection),
            ],
            children.map(([key, child]) => [key, toHtml(context, child)])
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
        [
            ...attributes,
            Html.style('display', 'flex'),
            Html.style('flex-direction', 'column'),
        ],
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
        [
            ...attributes,
            Html.style('display', 'flex'),
            Html.style('flex-direction', 'row'),
        ],
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
        flexDirection,
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
            return toHtml(context, useContext(context))
        }
    }
}

export function map<A, B, C>(layout: Layout<A, C>, f: (a: A) => B): Layout<B, C> {
    return {
        type: 'Layout',
        build: context => Html.map(toHtml(context, layout), f)
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

function toHtmlAttribute<E, C>(attribute: Attribute<E, C>, context: C, flexDirection: 'row' | 'column'): Html.Attribute<E> {
    if (attribute.tag === 'attributeUsingContext') {
        return attribute.htmlAttribute(context)
    }
    if (attribute.tag === 'attributeUsingFlexDirection') {
        return attribute.htmlAttribute(flexDirection)
    }
    return attribute
}

function toHtmlAttributes<E, C>(attributes: Array<Attribute<E, C>>, context: C, flexDirection: 'row' | 'column'): Array<Html.Attribute<E>> {
    return attributes.map(attr => toHtmlAttribute(attr, context, flexDirection))
}

// --- MERGED LAYOUTS (helper)

type MergedLayouts<Event, Context> = {
    type: 'MergedLayouts',
    build: (context: Context) => Array<Html.Html<Event>>,
}

function merge<E, C>(layouts: Array<Layout<E, C>>): MergedLayouts<E, C> {
    return {
        type: 'MergedLayouts',
        build: context => layouts.map(layout => toHtml(context, layout)),
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

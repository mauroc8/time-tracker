import * as Html from '../vdom/Html'
import * as Color from '../style/Color'
import * as Utils from '../utils/Utils'
import * as Decoder from '../utils/Decoder'

// --- LAYOUT

/** Helpers to create flexbox layouts with css styles.
*/
export type Layout<Event, Context> =
    | { type: 'Layout', build: (context: Context) => Html.Html<Event> }
    | Html.Html<Event>

export function toHtml<Event, Context>(
    context: Context,
    layout: Layout<Event, Context>,
): Html.Html<Event> {
    if (layout.type === 'Html') {
        return layout
    }

    return layout.build(context)
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
            buildAttributes(flexDirection, context, attributes),
            children.map(child => toHtml(context, child)),
        )
    }
}

function buildAttributes<E, C>(
    flexDirection: 'row' | 'column',
    context: C,
    attributes: Array<Attribute<E, C>>,
): Array<Html.Attribute<E>> {
    return [
        ...attributes.map(attribute => attributeToHtml(flexDirection, context, attribute)),
        Html.style('display', 'flex'),
        Html.style('flex-direction', flexDirection),
    ]
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
            buildAttributes(flexDirection, context, attributes),
            children.map(([key, child]) => [key, toHtml(context, child)]),
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

export function withContext<E, Context>(useContext: (context: Context) => Layout<E, Context>): Layout<E, Context> {
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
 * `Layout.attributeWithContext` that uses the context to create an `Html.Attribute`.
 */
export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: 'attributeWithContext', htmlAttribute: (context: Context) => Html.Attribute<Event> }
    | { tag: 'attributeWithFlexDirection', htmlAttribute: (flexDirection: 'row' | 'column') => Html.Attribute<Event> }

/** Use the current context to create a Html attribute.
 * For example, if the context is the color scheme:
 * 
 * ```ts
 * Layout.column(
 *   'div',
 *   [
 *     Layout.attributeWithContext(colorScheme => Layout.color(colorScheme.textColor)),
 *     Layout.attributeWithContext(colorScheme => Layout.backgroundColor(colorScheme.backgroundColor)),
 *   ],
 *   [
 *     Layout.text('Hello world'),
 *   ]
 * )
 * ```
*/
export function attributeWithContext<E, Context>(
    htmlAttribute: (context: Context) => Html.Attribute<E>
): Attribute<E, Context> {
    return {
        tag: 'attributeWithContext',
        htmlAttribute
    }
}

function attributeWithFlexDirection<E, C>(
    htmlAttribute: (flexDirection: 'row' | 'column') => Html.Attribute<E>
): Attribute<E, C> {
    return {
        tag: 'attributeWithFlexDirection',
        htmlAttribute
    }
}

function attributeToHtml<A, C>(
    flexDirection: 'row' | 'column',
    context: C,
    attribute: Attribute<A, C>,
): Html.Attribute<A> {
    switch (attribute.tag) {
        case 'attributeWithContext':
            return attribute.htmlAttribute(context)
        case 'attributeWithFlexDirection':
            return attribute.htmlAttribute(flexDirection)
        default:
            return attribute
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
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'center')
            : Html.style('justify-content', 'center')
    )
}

export function centerY<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'center')
            : Html.style('align-items', 'center')
    )
}

export function endX<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'end')
            : Html.style('justify-content', 'flex-end')
    )
}

export function endY<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'flex-end')
            : Html.style('align-items', 'end')
    )
}

export function startX<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('align-items', 'start')
            : Html.style('justify-content', 'flex-start')
    )
}

export function startY<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
        flexDirection === 'column'
            ? Html.style('justify-content', 'flex-start')
            : Html.style('align-items', 'start')
    )
}

export function baselineY<E, C>(): Attribute<E, C> {
    return attributeWithFlexDirection(flexDirection =>
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
    return Html.style('width', '100%')
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

export function on<E, A>(
    eventName: string,
    decoder: Decoder.Decoder<A>,
    handler: (event: A) => E,
    decodeError: (error: Decoder.Error) => E,
): Html.Attribute<E> {
    return Html.on(
        eventName,
        (event: Utils.Json) =>
            Decoder.decode(event, decoder)
                .caseOf(handler, decodeError)
    )
}

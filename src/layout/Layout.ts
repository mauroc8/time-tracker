import * as Html from '../vdom/Html'
import * as Color from '../style/Color'

// --- LAYOUT

/** Helpers to create HTML.
*/
export type Layout<Event, Context> = {
    type: 'Layout',
    build: (context: Context) => Html.Html<Event>
}

export function fromHtml<Event, Context>(
    html: Html.Html<Event>,
): Layout<Event, Context> {
    return {
        type: 'Layout',
        build: _ => html
    }
}

export function toHtml<Event, Context>(
    context: Context,
    layout: Layout<Event, Context>,
): Html.Html<Event> {
    return layout.build(context)
}

export function none<Event, Context>(): Layout<Event, Context> {
    return fromHtml(Html.text(''))
}

export function node<Event, Context>(
    htmlTag: string,
    attributes: Array<Attribute<Event, Context>>,
    children: Array<Layout<Event, Context>>,
): Layout<Event, Context> {
    return {
        type: 'Layout',
        build:
            context =>
                Html.node(
                    htmlTag,
                    toHtmlAttributes(attributes, context),
                    merge(children).build(context)
                ),
    }
}

export function column<E, C>(
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return node(
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
    return fromHtml(Html.text(text))
}

export function space<E, C>(size: number): Layout<E, C> {
    return fromHtml(
        Html.node(
            'div',
            [
                Html.style('display', 'inline-block'),
                Html.style('width', size + 'px'),
                Html.style('height', size + 'px'),
            ],
            []
        )
    )
}

/** Dibuja al nodo `below` 'flotando' debajo de `above`, como un menú o un tooltip. */
export function below<E, C>(
    tagName: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
    below: {
        tagName: string,
        attributes: Array<Attribute<E, C>>,
        children: Array<Layout<E, C>>,
    }
): Layout<E, C> {
    return node<E, C>(
        tagName,
        [
            ...attributes,
            Html.style('position', 'relative'),
        ],
        [
            ...children,
            node(
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
            return useContext(context).build(context)
        }
    }
}

export function map<A, B, C>(layout: Layout<A, C>, f: (a: A) => B): Layout<B, C> {
    return {
        type: 'Layout',
        build: context => Html.map(layout.build(context), f)
    }
}

// --- ATTRIBUTES

/** Layouts can receive the same attributes from the `Html` module, and also a
 * `Layout.attributeWithContext` that uses the context to create an `Html.Attribute`.
 */
export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: 'attributeWithContext', htmlAttribute: (context: Context) => Html.Attribute<Event> }

/** Use the current context to create a Html attribute.
 * For example, if the context is the color scheme:
 * 
 * ```ts
 * Layout.column(
 *   'div',
 *   [
 *     Layout.useContext(colorScheme => Html.style('color', colorScheme.textColor)),
 *     Layout.useContext(colorScheme => Html.style('background-color', colorScheme.backgroundColor)),
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

function toHtmlAttribute<E, C>(attribute: Attribute<E, C>, context: C): Html.Attribute<E> {
    if (attribute.tag === 'attributeWithContext') {
        return attribute.htmlAttribute(context)
    }
    return attribute
}

function toHtmlAttributes<E, C>(attributes: Array<Attribute<E, C>>, context: C): Array<Html.Attribute<E>> {
    return attributes.map(attr => toHtmlAttribute(attr, context))
}

// --- MERGED LAYOUTS (helper)

type MergedLayouts<Event, Context> = {
    type: 'MergedLayouts',
    build: (context: Context) => Array<Html.Html<Event>>,
}

function merge<E, C>(layouts: Array<Layout<E, C>>): MergedLayouts<E, C> {
    return {
        type: 'MergedLayouts',
        build: context => layouts.map(layout => layout.build(context)),
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

export function columnCenterX<A>(): Html.Attribute<A> {
    return Html.style('align-items', 'center');
}

export function rowCenterY<A>(): Html.Attribute<A> {
    return Html.style('align-items', 'center');
}

export function color<A>(color: Color.Color): Html.Attribute<A> {
    return Html.style('color', Color.toCssString(color));
}

export function backgroundColor<A>(color: Color.Color): Html.Attribute<A> {
    return Html.style('background-color', Color.toCssString(color));
}

export function borderColor<A>(color: Color.Color): Html.Attribute<A> {
    return Html.style('border-color', Color.toCssString(color));
}

export function borderWidth<A>(width: number): Html.Attribute<A> {
    return Html.style('border-width', `${Math.floor(width)}px`);
}

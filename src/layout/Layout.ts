import * as Html from '../vdom/Html'
import * as Color from '../style/Color'
import * as Utils from '../utils/Utils'
import * as Pair from '../utils/Pair'
import * as Css from './Css'

// --- Styled Html


type StyledHtml<E> =
    { html: Html.Html<E>, css: Array<Css.Statement> }

function mapStyledHtml<A, B>(styled: StyledHtml<A>, f: (a: A) => B): StyledHtml<B> {
    return {
        html: Html.map(styled.html, f),
        css: styled.css
    }
}

type StyledChildren<E> =
    { children: Array<Html.Html<E>>, css: Array<Css.Statement> }

function toStyledChildren<E, C>(
    context: C,
    children: Array<Layout<E, C>>
): StyledChildren<E> {
    return children
        .reduce(
            (collected, child) => {
                const { html, css } = toStyledHtml(context, child)

                collected.children.push(html)
                collected.css.push(...css)

                return collected
            },
            Utils.id<StyledChildren<E>>({
                children: [],
                css: []
            })
        )
}

function styledHtml<E, C>(
    context: C,
    flexDirection: 'row' | 'column',
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
    f: (
        htmlAttributes: Array<Html.Attribute<E>>,
        htmlChildren: Array<Html.Html<E>>,
    ) => Html.Html<E>
): StyledHtml<E> {
    const { children: htmlChildren, css: childrenCss } = toStyledChildren(context, children)
    const { attributes: htmlAttributes, css: attributesCss } = toStyledAttributes(attributes, context, flexDirection)

    return {
        html: f(htmlAttributes, htmlChildren),
        css: [ ...childrenCss, ...attributesCss ],
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
    containerTag: string,
    containerAttributes: Array<Html.Attribute<E>>,
    layout: Layout<E, C>,
): Html.Html<E> {
    const { html, css } = toStyledHtml(context, layout)

    return Html.node(
            containerTag,
            containerAttributes,
            [
                Css.toHtml(css),
                html
            ]
        )
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
        build: (context: C) => styledHtml(
            context,
            flexDirection,
            attributes,
            children,
            (htmlAttributes, htmlChildren) => Html.node(
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
        build: (context: C) => styledHtml(
            context,
            flexDirection,
            attributes,
            children.map(([_, child]) => child),
            (htmlAttributes, htmlChildren) => Html.keyed(
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
 * `Layout.attributeWithContext` that uses the context to create an `Html.Attribute`.
 */
export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: 'attributeWithContext', htmlAttribute: (context: Context) => Html.Attribute<Event> }
    | { tag: 'attributeWithFlexDirection', htmlAttribute: (flexDirection: 'row' | 'column') => Html.Attribute<Event> }
    | { tag: 'cssStatement', statement: Css.Statement }

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

export function class_<E, C>(class_: Css.Class): Attribute<E, C> {
    return { tag: 'cssStatement', statement: Css.class_(class_) }
}

export function rawCss<E, C>(selector: string, content: string): Attribute<E, C> {
    return { tag: 'cssStatement', statement: Css.raw(selector, content) }
}

type StyledAttribute<E> =
    { attribute: Html.Attribute<E>, statement?: Css.Statement }

function toStyledAttribute<E, C>(
    attribute: Attribute<E, C>,
    context: C,
    flexDirection: 'row' | 'column'
): StyledAttribute<E> {
    if (attribute.tag === 'attributeWithContext') {
        return { attribute: attribute.htmlAttribute(context) }
    }
    if (attribute.tag === 'attributeWithFlexDirection') {
        return { attribute: attribute.htmlAttribute(flexDirection) }
    }
    if (attribute.tag === 'cssStatement') {
        return {
            attribute: attribute.statement.tag === 'class'
                ? Html.class_(attribute.statement.class_.name)
                : Html.class_(''),
            statement: attribute.statement,
        }
    }
    return { attribute: attribute }
}

type StyledAttributes<E> =
    { attributes: Array<Html.Attribute<E>>, css: Array<Css.Statement> }

function toStyledAttributes<E, C>(
    attributes: Array<Attribute<E, C>>,
    context: C,
    flexDirection: 'row' | 'column'
): StyledAttributes<E> {
    const collectedHtmlAttributes = attributes
        .map(attr => toStyledAttribute(attr, context, flexDirection))
        .reduce(
            (collected, { attribute, statement }) => {
                collected.attributes.push(attribute)

                if (statement !== undefined) {
                    collected.css.push(statement)
                }

                return collected
            },
            Utils.id<StyledAttributes<E>>({ attributes: [], css: [] })
        )

    return {
        attributes: [
            ...collectedHtmlAttributes.attributes,
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

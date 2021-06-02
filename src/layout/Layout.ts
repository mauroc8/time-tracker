import * as Html from "../vdom/Html"

// --- LAYOUT

/** Unlike raw Html, a Layout generates a static stylesheet programatically.
 * Also, it carries a context that can be anything you want: state, settings or themes.
*/
export type Layout<Event, Context> = {
    type: "Layout",
    build: (context: Context) => {
        html: Html.Html<Event>,
        spacingX: Array<number>,
        spacingY: Array<number>,
    }
}

export function fromHtml<Event, Context>(
    html: Html.Html<Event>,
): Layout<Event, Context> {
    return {
        type: "Layout",
        build: _ => ({ html, spacingX: [], spacingY: [] })
    }
}

export function toHtml<Event, Context>(
    context: Context,
    htmlTag: string,
    attributes: Array<Attribute<Event, Context>>,
    children: Array<Layout<Event, Context>>,
): Html.Html<Event> {
    const mergedLayouts = merge(children).build(context)

    return Html.node(
        htmlTag,
        toHtmlAttributes(attributes, context),
        [
            Html.node(
                "style",
                [],
                [
                    Html.text(
                        [ ...new Set(mergedLayouts.spacingX) ]
                            .map(n => spacingToCssString("x", n))
                            .join("\n")
                    ),
                ]
            ),
            Html.node(
                "style",
                [],
                [
                    Html.text(
                        [ ...new Set(mergedLayouts.spacingY) ]
                            .map(n => spacingToCssString("y", n))
                            .join("\n\n")
                    )
                ]
            ),
            ...mergedLayouts.html,
        ],
    )
}

function spacingToCssString(axis: "x" | "y", spacing: number): string {
    return `
.spacing-${axis}-${spacing} > * { margin-${axis === "x" ? "left" : "top"}: ${spacing}px }
.spacing-${axis}-${spacing} > *:first-child { margin-${axis === "x" ? "left" : "top"}: 0 }
    `.trim()
}

export function none<Event, Context>(): Layout<Event, Context> {
    return fromHtml(Html.text(""))
}

export function node<Event, Context>(
    htmlTag: string,
    attributes: Array<Attribute<Event, Context>>,
    children: Array<Layout<Event, Context>>,
): Layout<Event, Context> {
    return {
        type: "Layout",
        build: context => {
            const mergedLayouts = merge(children).build(context)

            return {
                html: Html.node(htmlTag, toHtmlAttributes(attributes, context), mergedLayouts.html),
                spacingX: mergedLayouts.spacingX,
                spacingY: mergedLayouts.spacingY,
            }
        }
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
            Html.style("display", "flex"),
            Html.style("flex-direction", "column"),
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
            Html.style("display", "flex"),
            Html.style("flex-direction", "row"),
        ],
        children
    )
}

function addSpacing<E, C>(axis: "x" | "y", spacing: number, layout: Layout<E, C>): Layout<E, C> {
    return {
        type: "Layout",
        build: context => {
            const built = layout.build(context)

            return {
                html: built.html,
                spacingX: axis === "x" ? [ spacing, ...built.spacingX ] : built.spacingX,
                spacingY: axis === "y" ? [ spacing, ...built.spacingY ] : built.spacingY,
            }
        }
    }
}

export function columnWithSpacing<E, C>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return addSpacing(
        "y",
        spacing,
        column(
            htmlTag,
            [
                ...attributes,
                Html.class_(`spacing-y-${spacing}`),
            ],
            children
        )
    )
}

export function rowWithSpacing<E, C>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    return addSpacing(
        "x",
        spacing,
        column(
            htmlTag,
            [
                ...attributes,
                Html.class_(`spacing-x-${spacing}`),
            ],
            children
        )
    )
}

export function text<E, C>(text: string): Layout<E, C> {
    return fromHtml(Html.text(text))
}

export function space<E, C>(size: number): Layout<E, C> {
    return fromHtml(
        Html.node(
            "div",
            [
                Html.style("display", "inline-block"),
                Html.style("width", size + "px"),
                Html.style("height", size + "px"),
            ],
            []
        )
    )
}

/** Dibuja al nodo `below` "flotando" debajo de `above`, como un menú o un tooltip. */
export function below<E, C>(
    tagName: string,
    attributes: Array<Attribute<E, C>>,
    above: Layout<E, C>,
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
            Html.style("position", "relative"),
        ],
        [
            above,
            node(
                below.tagName,
                [
                    ...below.attributes,
                    Html.style("position", "absolute"),
                    Html.style("top", "100%"),
                ],
                below.children
            )
        ]
    )
}

export function withContext<E, Context>(useContext: (context: Context) => Layout<E, Context>): Layout<E, Context> {
    return {
        type: "Layout",
        build: context => {
            return useContext(context).build(context)
        }
    }
}

export function map<A, B, C>(layout: Layout<A, C>, f: (a: A) => B): Layout<B, C> {
    return {
        type: "Layout",
        build: context => {
            const built = layout.build(context)

            return {
                html: Html.map(built.html, f),
                spacingX: built.spacingX,
                spacingY: built.spacingY,
            }
        }
    }
}

// --- ATTRIBUTES

/** Layouts can receive the same attributes from the `Html` module, and also a
 * `Layout.attributeWithContext` that uses the context to create an `Html.Attribute`.
 */
export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: "attributeWithContext", htmlAttribute: (context: Context) => Html.Attribute<Event> }

/** Use the current context to create a Html attribute.
 * For example, if the context is the color scheme:
 * 
 * ```ts
 * Layout.column(
 *   "div",
 *   [
 *     Layout.useContext(colorScheme => Html.style("color", colorScheme.textColor)),
 *     Layout.useContext(colorScheme => Html.style("background-color", colorScheme.backgroundColor)),
 *   ],
 *   [
 *     Layout.text("Hello world"),
 *   ]
 * )
 * ```
*/
export function attributeWithContext<E, Context>(
    htmlAttribute: (context: Context) => Html.Attribute<E>
): Attribute<E, Context> {
    return {
        tag: "attributeWithContext",
        htmlAttribute
    }
}

function toHtmlAttribute<E, C>(attribute: Attribute<E, C>, context: C): Html.Attribute<E> {
    if (attribute.tag === "attributeWithContext") {
        return attribute.htmlAttribute(context)
    }
    return attribute
}

function toHtmlAttributes<E, C>(attributes: Array<Attribute<E, C>>, context: C): Array<Html.Attribute<E>> {
    return attributes.map(attr => toHtmlAttribute(attr, context))
}

// --- MERGED LAYOUTS (helper)

type MergedLayouts<Event, Context> = {
    type: "MergedLayouts",
    build: (context: Context) => {
        html: Array<Html.Html<Event>>,
        spacingX: Array<number>,
        spacingY: Array<number>,
    }
}

function merge<E, C>(layouts: Array<Layout<E, C>>): MergedLayouts<E, C> {
    return {
        type: "MergedLayouts",
        build: context => {
            const built = layouts.map(layout => layout.build(context));
            
            return {
                html: built.map(x => x.html),
                spacingX: built.flatMap(x => x.spacingX),
                spacingY: built.flatMap(x => x.spacingY),
            }
        },
    }
}

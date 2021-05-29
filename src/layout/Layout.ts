import * as Html from "../vdom/Html"

// --- LAYOUT

/** Unlike raw Html, a Layout generates a static stylesheet programatically.
 * Also, it carries a context that can be anything you want:
 * settings or themes. That context can be used to define attributes (see `useContext`).
*/
export type Layout<Event, Context> = {
    html: (context: Context) => Html.Html<Event>,
    spacingX: Array<number>,
    spacingY: Array<number>,
}

export function fromHtml<Event, Context>(
    html: Html.Html<Event>,
): Layout<Event, Context> {
    return {
        html: _ => html,
        spacingX: [],
        spacingY: [],
    }
}

export function toHtml<Event, Context>(
    context: Context,
    htmlTag: string,
    attributes: Array<Attribute<Event, Context>>,
    children: Array<Layout<Event, Context>>,
): Html.Html<Event> {
    const mergedLayouts = merge(children)

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
            ...mergedLayouts.html(context),
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
    const mergedLayouts = merge(children)

    return {
        html: context =>
            Html.node(htmlTag, toHtmlAttributes(attributes, context), mergedLayouts.html(context)),
        spacingX: mergedLayouts.spacingX,
        spacingY: mergedLayouts.spacingY,
    }
}

export function column<E, C>(
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    const mergedLayouts = merge(children)

    return {
        html: context =>
            Html.node(
                htmlTag,
                [
                    ...toHtmlAttributes(attributes, context),
                    Html.style("display", "flex"),
                    Html.style("flex-direction", "column"),
                ],
                mergedLayouts.html(context)
            ),
        spacingX: mergedLayouts.spacingX,
        spacingY: mergedLayouts.spacingY
    }
}

export function columnWithSpacing<E, C>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    const mergedLayouts = merge(children)

    mergedLayouts.spacingY.push(spacing)

    return {
        html: context =>
            Html.node(
                htmlTag,
                [
                    ...toHtmlAttributes(attributes, context),
                    Html.style("display", "flex"),
                    Html.style("flex-direction", "column"),
                    Html.class_(`spacing-y-${spacing}`)
                ],
                mergedLayouts.html(context)
            ),
        spacingX: mergedLayouts.spacingX,
        spacingY: mergedLayouts.spacingY,
    }
}

export function row<E, C>(
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    const mergedLayouts = merge(children)

    return {
        html: context =>
            Html.node(
                htmlTag,
                [
                    ...toHtmlAttributes(attributes, context),
                    Html.style("display", "flex"),
                    Html.style("flex-direction", "row"),
                ],
                mergedLayouts.html(context)
            ),
        spacingX: mergedLayouts.spacingX,
        spacingY: mergedLayouts.spacingY
    }
}

export function rowWithSpacing<E, C>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Attribute<E, C>>,
    children: Array<Layout<E, C>>,
): Layout<E, C> {
    const mergedLayouts = merge(children)

    mergedLayouts.spacingX.push(spacing)

    return {
        html: context =>
            Html.node(
                htmlTag,
                [
                    ...toHtmlAttributes(attributes, context),
                    Html.style("display", "flex"),
                    Html.style("flex-direction", "row"),
                    Html.class_(`spacing-x-${spacing}`),
                ],
                mergedLayouts.html(context)
            ),
        spacingX: mergedLayouts.spacingX,
        spacingY: mergedLayouts.spacingY
    }
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

export function below<E, C>(
    tagName: string,
    attributes: Array<Attribute<E, C>>,
    layout: Layout<E, C>,
    below: {
        tagName: string,
        attributes: Array<Attribute<E, C>>,
        children: Array<Layout<E, C>>,
    }
): Layout<E, C> {
    const belowNode = node<E, C>(
        below.tagName,
        [
            ...below.attributes,
            Html.style("position", "absolute"),
            Html.style("top", "100%"),
        ],
        below.children
    )

    return {
        html: context =>
            Html.node(
                tagName,
                [
                    ...toHtmlAttributes(attributes, context),
                    Html.style("position", "relative"),
                ],
                [
                    layout.html(context),
                    belowNode.html(context),
                ]
            ),
        spacingX: [ ...layout.spacingX, ...belowNode.spacingX ],
        spacingY: [ ...layout.spacingY, ...belowNode.spacingY ],
    }
}

// --- ATTRIBUTES

export type Attribute<Event, Context> =
    | Html.Attribute<Event>
    | { tag: "usingContext", htmlAttribute: (context: Context) => Html.Attribute<Event> }

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
export function useContext<E, Context>(f: (context: Context) => Html.Attribute<E>): Attribute<E, Context> {
    return {
        tag: "usingContext",
        htmlAttribute: f
    }
}

function toHtmlAttribute<E, C>(attribute: Attribute<E, C>, context: C): Html.Attribute<E> {
    if (attribute.tag === "usingContext") {
        return attribute.htmlAttribute(context)
    }
    return attribute
}

function toHtmlAttributes<E, C>(attributes: Array<Attribute<E, C>>, context: C): Array<Html.Attribute<E>> {
    return attributes.map(attr => toHtmlAttribute(attr, context))
}

// --- MERGED LAYOUTS (helper)

type MergedLayouts<Event, Context> = {
    html: (context: Context) => Array<Html.Html<Event>>,
    spacingX: Array<number>,
    spacingY: Array<number>,
}

function merge<E, C>(layouts: Array<Layout<E, C>>): MergedLayouts<E, C> {
    return {
        html: context =>
            layouts.map(layout => layout.html(context)),
        spacingX: layouts.flatMap(layout => layout.spacingX),
        spacingY: layouts.flatMap(layout => layout.spacingY),
    }
}

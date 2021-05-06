import * as Html from "../vdom/Html";
import * as Css from './Css'

export type Layout<A> = {
    html: Html.Html<A>,
    css: Css.Css
}

export function fromHtml<A>(html: Html.Html<A>, css: Css.Css): Layout<A> {
    return { html, css }
}

export function toHtml<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    layout: Layout<A>
): Html.Html<A> {
    return Html.node(
        htmlTag,
        attributes,
        [
            Css.toHtml(layout.css),
            layout.html
        ]
    )
}

export function node<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return fromHtml(
        Html.node(htmlTag, attributes, children.map(layout => layout.html)),
        children
            .map(layout => layout.css)
            .reduce(Css.merge, Css.empty())
    )
}

export function column<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return fromHtml(
        Html.node(
            htmlTag,
            [ ...attributes, Html.class_("flex"), Html.class_("flex-column")],
            children.map(layout => layout.html)
        ),
        Css.merge(
            children
                .map(layout => layout.css)
                .reduce(Css.merge, Css.empty()),
            {
                ".flex": { "display": "flex" },
                ".flex-column": { "flex-direction": "column" }
            }
        )
    )
}

export function columnWithSpacing<A>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return withSpacingY(spacing, column(htmlTag, attributes, children))
}

export function rowWithSpacing<A>(
    spacing: number,
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return withSpacingX(spacing, row(htmlTag, attributes, children))
}

export function row<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return fromHtml(
        Html.node(
            htmlTag,
            [...attributes, Html.class_("flex"), Html.class_("flex-row")],
            children.map(layout => layout.html)
        ),
        Css.merge(
            children
                .map(layout => layout.css)
                .reduce(Css.merge, Css.empty()),
            {
                ".flex": { "display": "flex" },
                ".flex-row": { "flex-direction": "row" }
            }
        )
    )
}

export function text<A>(text: string): Layout<A> {
    return fromHtml(Html.text(text), {})
}

export function space<A>(size: number): Layout<A> {
    return fromHtml(
        Html.node(
            "div",
            [
                Html.style("width", size + "px"),
                Html.style("height", size + "px"),
            ],
            []
        ),
        {}
    )
}

export function withCss<A>(css: Css.Css, layout: Layout<A>): Layout<A> {
    return fromHtml(
        layout.html,
        Css.merge(layout.css, css)
    )
}

export function withSpacingY<A>(spacing: number, layout: Layout<A>): Layout<A> {
    spacing = Math.floor(spacing)

    return fromHtml(
        Html.addAttributes(
            [Html.class_(`spacing-y-${spacing}`)],
            layout.html
        ),
        Css.merge(
            layout.css,
            {
                [`.spacing-y-${spacing} > *`]: { "margin-top": `${spacing}px` },
                [`.spacing-y-${spacing} > *:first-child`]: { "margin-top": "0" }
            }
        )
    )
}

export function withSpacingX<A>(spacing: number, layout: Layout<A>): Layout<A> {
    spacing = Math.floor(spacing)

    return fromHtml(
        Html.addAttributes(
            [Html.class_(`spacing-x-${spacing}`)],
            layout.html
        ),
        Css.merge(
            layout.css,
            {
                [`.spacing-x-${spacing} > *`]: { "margin-left": `${spacing}px` },
                [`.spacing-x-${spacing} > *:first-child`]: { "margin-left": "0" }
            }
        )
    )
}

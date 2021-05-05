import * as Html from "../vdom/Html";

export type Layout<A> = {
    html: Html.Html<A>,
    css: { [selector: string]: string }
}

export function fromHtml<A>(html: Html.Html<A>, css: { [selector: string]: string }): Layout<A> {
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
            Html.node("style", [], [Html.text(cssToString(layout.css))]),
            layout.html
        ]
    )
}

function cssToString(css: { [selector: string]: string }): string {
    return Object.entries(css).reduce(
        (accumulated, [selector, css]) => `${accumulated}\n${selector} { ${css} }`,
        ""
    )
}

export function node<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return fromHtml(
        Html.node(htmlTag, attributes, children.map(({ html }) => html)),
        children.reduce(
            (css, layout) => ({ ...css, ...layout.css }),
            {}
        )
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
            [ ...attributes, Html.class_("flex flex-column")],
            children.map(({ html }) => html)
        ),
        children.reduce(
            (css, layout) => ({ ...css, ...layout.css }),
            {
                ".flex": "display: flex",
                ".flex-column": "flex-direction: column",
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
            [...attributes, Html.class_("flex flex-row")],
            children.map(({ html }) => html)
        ),
        children.reduce(
            (css, layout) => ({ ...css, ...layout.css }),
            {
                ".flex": "display: flex",
                ".flex-row": "flex-direction: row"
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

function mapHtml<A, B>(
    fun: (a: Html.Html<A>) => Html.Html<B>,
    layout: Layout<A>
): Layout<B> {
    return fromHtml(
        fun(layout.html),
        layout.css
    )
}

export function withCss<A>(css: { [selector: string]: string }, layout: Layout<A>): Layout<A> {
    return fromHtml(
        layout.html,
        { ...layout.css, ...css }
    )
}

export function withSpacingY<A>(spacing: number, layout: Layout<A>): Layout<A> {
    return withCss(
        {
            [`.spacing-y-${spacing} > *`]: `margin-top: ${spacing}px`,
            [`.spacing-y-${spacing} > *:first-child`]: `margin-top: 0`
        },
        mapHtml(
            (html =>
                Html.addAttributes(
                    [Html.class_(`spacing-y-${spacing}`)],
                    html
                )
            ),
            layout
        )
    )
}

export function withSpacingX<A>(spacing: number, layout: Layout<A>): Layout<A> {
    return withCss(
        {
            [`.spacing-x-${spacing} > *`]: `margin-left: ${spacing}px`,
            [`.spacing-x-${spacing} > *:first-child`]: `margin-left: 0`
        },
        mapHtml(
            (html =>
                Html.addAttributes(
                    [Html.class_(`spacing-x-${spacing}`)],
                    html
                )
            ),
            layout
        )
    )
}

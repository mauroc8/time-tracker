import * as Html from "../vdom/Html";
import * as Utils from "../Utils";
import * as Maybe from "../Maybe";
import * as Array from '../Array';
import * as Attr from './Attribute'

export type Layout<A> =
    | {
        layoutType: "layout",
        direction: "column" | "row",
        htmlTag: string,
        attributes: Array<Attr.Attribute<A>>,
        children: Array<Layout<A>>,
    }
    | {
        layoutType: "html",
        html: Html.Html<A>
    }


function getSpacing<A>(attribute: Attr.Attribute<A>): Maybe.Maybe<number> {
    if (attribute.attributeType === "spacing")
        return Maybe.just(attribute.value)
    else
        return Maybe.nothing()
}

function toHtmlAttribute<A>(attribute: Attr.Attribute<A>): Maybe.Maybe<Html.Attribute<A>> {
    switch (attribute.attributeType) {
        case "htmlAttribute":
            return Maybe.just(attribute.value)
        case "spacing":
            return Maybe.nothing()
        case "emptyAttribute":
            return Maybe.nothing()
    }
}

export function toHtml<A>(layout: Layout<A>): Html.Html<A> {
    switch (layout.layoutType) {
        case "html":
            return layout.html

        case "layout":
            const spacing =
                Array.filterMap(layout.attributes, getSpacing)[0] ?? 0

            return Html.node(
                layout.htmlTag,
                [
                    Html.style("display", "flex"),
                    Html.style("flex-direction", layout.direction),
                    ...Array.filterMap(layout.attributes, toHtmlAttribute)
                ],
                (() => {
                    const childrenToHtml =
                        (children: Array<Layout<A>>) =>
                            children.map(child => toHtml(child))

                    if (spacing !== 0) {
                        return childrenToHtml(
                            Array.intersperse(layout.children, space(spacing))
                        )
                    } else {
                        return childrenToHtml(layout.children)
                    }
                })()
            )
    }
}

export function column<A>(
    htmlTag: string,
    attributes: Array<Attr.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return { layoutType: "layout", direction: "column", htmlTag, attributes, children }
}


export function row<A>(
    htmlTag: string,
    attributes: Array<Attr.Attribute<A>>,
    children: Array<Layout<A>>,
): Layout<A> {
    return { layoutType: "layout", direction: "row", htmlTag, attributes, children }
}

export function space<A>(size: number): Layout<A> {
    return html(
        Html.node(
            "div",
            [
                Html.style("width", size + "px"),
                Html.style("height", size + "px"),
            ],
            []
        )
    )
}

export function html<A>(html: Html.Html<A>): Layout<A> {
    return { layoutType: "html", html }
}

export function text<A>(text: string): Layout<A> {
    return html(Html.text(text))
}

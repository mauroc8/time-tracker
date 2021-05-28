import * as Color from './Color'

import * as Html from '../vdom/Html'

import * as Layout from '../layout/Layout'

export function wrapper<A>(
    htmlTag: string,
    attributes: Array<Html.Attribute<A>>,
    icon: Html.Html<never>
): Layout.Layout<A> {
    return Layout.node(
        htmlTag,
        [
            Html.style("width", "16px"),
            Html.style("height", "16px"),
            Html.style("border-radius", "50%"),
            Html.style("display", "flex"),
            Html.style("align-items", "center"),
            Html.style("justify-content", "center"),
            Html.style("background-color", Color.toCssString(Color.background)),
            ...attributes
        ],
        [
            Layout.fromHtml(icon, {})
        ]
    )
}

export function button<A>(attributes: Array<Html.Attribute<A>>, icon: Html.Html<never>): Layout.Layout<A> {
    return wrapper(
        "button",
        attributes,
        icon
    )
}

export function play<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "media-play.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function delete_<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "trash.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function options<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "ellipses.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronUp<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-top.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronDown<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-bottom.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronLeft<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-left.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}

export function chevronRight<A>(): Html.Html<A> {
    return Html.node(
        "img",
        [
            Html.attribute("src", "chevron-right.svg"),
            Html.attribute("width", "8"),
            Html.attribute("height", "8"),
        ],
        []
    )
}
